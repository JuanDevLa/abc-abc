// src/routes/analytics.routes.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

/* ─── POST /api/v1/analytics/view — Registrar visita de producto (público) ─── */
router.post('/analytics/view', async (req: Request, res: Response) => {
  const { productId } = req.body;

  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ error: 'productId requerido' });
  }

  try {
    await prisma.productView.create({ data: { productId } });
    return res.status(200).json({ ok: true });
  } catch {
    // Fallo silencioso — no interrumpir la experiencia del usuario
    return res.status(200).json({ ok: false });
  }
});

/* ─── GET /api/v1/analytics/abandoned — Carritos abandonados (admin) ─── */
router.get('/analytics/abandoned', requireAuth, async (_req: Request, res: Response) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // Hace 24 horas

  try {
    const abandoned = await prisma.order.findMany({
      where: {
        status: 'PENDING_PAYMENT',
        createdAt: { lt: since },
      },
      select: {
        id:          true,
        orderNumber: true,
        email:       true,
        firstName:   true,
        lastName:    true,
        totalCents:  true,
        createdAt:   true,
        items: {
          select: {
            productName: true,
            quantity:    true,
            totalCents:  true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.json({ total: abandoned.length, items: abandoned });
  } catch (err) {
    console.error('Error obteniendo carritos abandonados:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

/* ─── GET /api/v1/analytics/views/:productId — Vistas de un producto (admin) ─── */
router.get('/analytics/views/:productId', requireAuth, async (req: Request, res: Response) => {
  const { productId } = req.params;

  try {
    const count = await prisma.productView.count({ where: { productId } });
    return res.json({ productId, views: count });
  } catch {
    return res.status(500).json({ error: 'Error interno' });
  }
});

/* ─── GET /api/v1/analytics/dashboard — Métricas del dashboard (admin) ─── */
router.get('/analytics/dashboard', requireAuth, async (_req: Request, res: Response) => {
  try {
    const paidStatuses = ['PAID', 'SHIPPED', 'DELIVERED'] as const;

    // 1. Obtener todas las órdenes pagadas para calcular comisiones por orden
    const paidOrders = await prisma.order.findMany({
      where: { status: { in: [...paidStatuses] } },
      select: { totalCents: true, createdAt: true },
    });

    // Comisión de Stripe: 3.6% + $3.00 MXN fijos por transacción
    const STRIPE_PERCENT = 0.036;
    const STRIPE_FIXED_CENTS = 300;

    let grossRevenueCents = 0;
    let totalFeesCents = 0;

    // Ventas de hoy
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    let todayGrossCents = 0;
    let todayFeesCents = 0;
    let todayOrderCount = 0;

    for (const order of paidOrders) {
      const fee = Math.round(order.totalCents * STRIPE_PERCENT) + STRIPE_FIXED_CENTS;
      grossRevenueCents += order.totalCents;
      totalFeesCents += fee;

      if (order.createdAt >= todayStart) {
        todayGrossCents += order.totalCents;
        todayFeesCents += fee;
        todayOrderCount++;
      }
    }

    const netRevenueCents = grossRevenueCents - totalFeesCents;
    const todayNetCents = todayGrossCents - todayFeesCents;

    // 2. Órdenes pendientes de envío (pagadas pero no enviadas)
    const pendingShipment = await prisma.order.count({
      where: { status: 'PAID' },
    });

    // 3. Total de productos
    const totalProducts = await prisma.product.count();

    return res.json({
      grossRevenueCents,
      netRevenueCents,
      totalFeesCents,
      todayGrossCents,
      todayNetCents,
      todayOrderCount,
      pendingShipment,
      totalProducts,
    });
  } catch (err) {
    console.error('Error obteniendo métricas del dashboard:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

export default router;
