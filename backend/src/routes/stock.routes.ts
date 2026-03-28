import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { generateStockReportPDF } from '../services/pdf.service.js';

const router = Router();

// ─── GET /admin/stock ─────────────────────────────────────────────────────────
// Todos los productos con sus variantes, stock actual, vendido y reposiciones.
router.get('/admin/stock', requireAuth, async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    // Detectar si la tabla StockMovement ya existe
    let hasStockMovements = false;
    try {
      await (prisma as any).stockMovement.findFirst({ take: 1 });
      hasStockMovements = true;
    } catch {
      hasStockMovements = false;
    }

    const variantSelect: any = {
      id: true,
      sku: true,
      size: true,
      color: true,
      audience: true,
      isDropshippable: true,
      stock: true,
    };
    if (hasStockMovements) {
      variantSelect.stockMovements = {
        select: { id: true, quantity: true, notes: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      };
    }

    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        images: { select: { url: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
        variants: {
          select: variantSelect,
          orderBy: [{ size: 'asc' }, { color: 'asc' }],
        },
      },
      orderBy: { name: 'asc' },
    });

    // Para cada variante, calcular unidades vendidas desde órdenes confirmadas
    const variantIds: string[] = products.flatMap(p => p.variants.map((v: any) => v.id as string));

    // Agrupa la suma de quantity por variantId en órdenes pagadas/en proceso/enviadas/entregadas
    const soldAgg = await prisma.orderItem.groupBy({
      by: ['variantId'],
      where: {
        variantId: { in: variantIds },
        order: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
      },
      _sum: { quantity: true },
    });

    const soldMap: Record<string, number> = {};
    for (const row of soldAgg) {
      if (row.variantId) soldMap[row.variantId] = row._sum?.quantity ?? 0;
    }

    const result = products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      imageUrl: p.images[0]?.url ?? null,
      variants: p.variants.map((v: any) => {
        const sold = soldMap[v.id] ?? 0;
        const movements: any[] = v.stockMovements ?? [];
        const totalRestocked = movements.reduce((s: number, m: any) => s + m.quantity, 0);
        const initialStock = v.stock + sold - totalRestocked;
        return {
          id: v.id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          audience: v.audience,
          isDropshippable: v.isDropshippable,
          stock: v.stock,
          sold,
          totalRestocked,
          initialStock: Math.max(0, initialStock),
          recentMovements: movements,
        };
      }),
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching stock:', err);
    res.status(500).json({ error: 'Error al obtener el inventario' });
  }
});

// ─── POST /admin/stock/:variantId/restock ─────────────────────────────────────
// Reponer stock: incrementa variant.stock y registra un StockMovement.
router.post('/admin/stock/:variantId/restock', requireAuth, async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { variantId } = req.params;
  const quantity = Number(req.body.quantity);
  const notes: string = req.body.notes ?? '';

  if (!quantity || quantity < 1 || quantity > 9999) {
    res.status(400).json({ error: 'Cantidad inválida (1-9999)' });
    return;
  }

  try {
    // Si StockMovement aún no existe, solo actualizar el stock
    let movement = null;
    let variant;
    try {
      const result = await prisma.$transaction([
        (prisma as any).stockMovement.create({ data: { variantId, quantity, notes } }),
        prisma.productVariant.update({
          where: { id: variantId },
          data: { stock: { increment: quantity } },
          select: { id: true, sku: true, stock: true },
        }),
      ]);
      movement = result[0];
      variant = result[1];
    } catch {
      // Tabla StockMovement no existe todavía, solo actualizar stock
      variant = await prisma.productVariant.update({
        where: { id: variantId },
        data: { stock: { increment: quantity } },
        select: { id: true, sku: true, stock: true },
      });
    }

    res.json({ movement, variant });
  } catch (err) {
    console.error('Error restocking:', err);
    res.status(500).json({ error: 'Error al reponer stock' });
  }
});

// ─── GET /admin/stock/report/pdf ─────────────────────────────────────────────
// Descarga PDF con el inventario completo.
router.get('/admin/stock/report/pdf', requireAuth, async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const products = await prisma.product.findMany({
      select: {
        name: true,
        variants: {
          select: {
            id: true,
            sku: true,
            size: true,
            color: true,
            isDropshippable: true,
            stock: true,
            stockMovements: { select: { quantity: true } },
          },
          orderBy: [{ size: 'asc' }, { color: 'asc' }],
        },
      },
      orderBy: { name: 'asc' },
    });

    const allIds = products.flatMap(p => p.variants.map(v => v.id));
    const soldAgg = await prisma.orderItem.groupBy({
      by: ['variantId'],
      where: {
        variantId: { in: allIds },
        order: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
      },
      _sum: { quantity: true },
    });
    const soldMap: Record<string, number> = {};
    for (const row of soldAgg) {
      if (row.variantId) soldMap[row.variantId] = row._sum?.quantity ?? 0;
    }

    const reportData = products.map(p => ({
      name: p.name,
      variants: p.variants.map(v => {
        const sold = soldMap[v.id] ?? 0;
        const restocked = v.stockMovements.reduce((s, m) => s + m.quantity, 0);
        return {
          sku: v.sku,
          size: v.size ?? '—',
          color: v.color ?? '—',
          isDropshippable: v.isDropshippable,
          stock: v.stock,
          sold,
          restocked,
          initialStock: Math.max(0, v.stock + sold - restocked),
        };
      }),
    }));

    const pdfBuffer = await generateStockReportPDF(reportData);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="inventario-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating stock PDF:', err);
    res.status(500).json({ error: 'Error al generar el PDF' });
  }
});

export default router;
