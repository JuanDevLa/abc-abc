// backend/src/routes/crm.routes.ts
import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

const PAID = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;

function adminOnly(req: Request, res: Response): boolean {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }
  return true;
}

/* ─── GET /api/v1/admin/crm/customers ─────────────────────────────────────────
   Lista enriquecida con stats agregadas de órdenes.
   ?search=&page=&limit=&tag=&sort=recent|spent_desc|orders_desc
──────────────────────────────────────────────────────────────────────────── */
router.get('/customers', requireAuth, async (req: Request, res: Response) => {
  if (!adminOnly(req, res)) return;

  const page   = Math.max(1, Number(req.query.page)  || 1);
  const limit  = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const skip   = (page - 1) * limit;
  const search = String(req.query.search || '').trim().toLowerCase();
  const tag    = String(req.query.tag    || '').trim();
  const sort   = String(req.query.sort   || 'recent');

  const sortMap: Record<string, Prisma.Sql> = {
    spent_desc:  Prisma.sql`COALESCE(o.total_spent, 0) DESC`,
    orders_desc: Prisma.sql`COALESCE(o.order_count, 0) DESC`,
    recent:      Prisma.sql`u."createdAt" DESC`,
  };
  const orderBy = sortMap[sort] ?? sortMap.recent;

  // Crear condiciones fresh en cada uso para evitar conflictos de parámetros
  const makeSearchCond = () => search
    ? Prisma.sql`AND (lower(u.email) LIKE ${`%${search}%`} OR lower(COALESCE(u.name,'')) LIKE ${`%${search}%`})`
    : Prisma.empty;

  const makeTagCond = () => tag
    ? Prisma.sql`AND ${tag} = ANY(u."customerTags")`
    : Prisma.empty;

  try {
    type CRMRow = {
      id: string; email: string; name: string | null; phone: string | null;
      emailVerifiedAt: Date | null; createdAt: Date;
      customerTags: string[]; rewardPoints: number;
      orderCount: number; totalSpentCents: number;
      lastOrderDate: Date | null; avgOrderValueCents: number;
    };

    const [customers, countResult] = await Promise.all([
      prisma.$queryRaw<CRMRow[]>`
        SELECT u.id, u.email, u.name, u.phone,
               u."emailVerifiedAt", u."createdAt",
               u."customerTags", u."rewardPoints",
               COALESCE(o.order_count, 0)::int AS "orderCount",
               COALESCE(o.total_spent, 0)::int AS "totalSpentCents",
               o.last_order                    AS "lastOrderDate",
               CASE WHEN COALESCE(o.order_count, 0) > 0
                    THEN (COALESCE(o.total_spent, 0) / o.order_count)::int
                    ELSE 0 END                 AS "avgOrderValueCents"
        FROM "User" u
        LEFT JOIN (
          SELECT "userId",
                 COUNT(*)::int     AS order_count,
                 SUM("totalCents") AS total_spent,
                 MAX("createdAt")  AS last_order
          FROM   "Order"
          WHERE  status IN ('PAID','PROCESSING','SHIPPED','DELIVERED')
                 AND "userId" IS NOT NULL
          GROUP  BY "userId"
        ) o ON o."userId" = u.id
        WHERE u.role = 'CUSTOMER'
        ${makeSearchCond()}
        ${makeTagCond()}
        ORDER BY ${orderBy}
        LIMIT ${limit} OFFSET ${skip}
      `,
      prisma.$queryRaw<[{ count: number }]>`
        SELECT COUNT(*)::int AS count
        FROM   "User" u
        WHERE  u.role = 'CUSTOMER'
        ${makeSearchCond()}
        ${makeTagCond()}
      `,
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return res.json({
      items: customers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

/* ─── GET /api/v1/admin/crm/customers/:id ─────────────────────────────────────
   Detalle completo: stats, órdenes, notas, historial de puntos.
──────────────────────────────────────────────────────────────────────────── */
router.get('/customers/:id', requireAuth, async (req: Request, res: Response) => {
  if (!adminOnly(req, res)) return;

  const { id } = req.params;

  try {
    const [user, orders, notes, rewardHistory] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: {
          id: true, email: true, name: true, phone: true,
          emailVerifiedAt: true, createdAt: true,
          customerTags: true, rewardPoints: true,
        },
      }),
      prisma.order.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, orderNumber: true, status: true,
          totalCents: true, shippingCents: true, shippingMethod: true,
          trackingNumber: true, createdAt: true,
          items: {
            select: {
              productName: true, variantSize: true, variantColor: true,
              quantity: true, totalCents: true, productImageUrl: true,
            },
          },
        },
      }),
      prisma.customerNote.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, content: true, createdAt: true },
      }),
      prisma.rewardTransaction.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, type: true, points: true, description: true, orderId: true, createdAt: true },
      }),
    ]);

    if (!user) return res.status(404).json({ error: 'Cliente no encontrado' });

    // Stats calculadas sobre órdenes pagadas
    const paidOrders      = orders.filter(o => PAID.includes(o.status as typeof PAID[number]));
    const totalSpentCents = paidOrders.reduce((s, o) => s + o.totalCents, 0);
    const totalOrders     = paidOrders.length;
    const avgOrderCents   = totalOrders > 0 ? Math.round(totalSpentCents / totalOrders) : 0;
    const firstOrderDate  = paidOrders.at(-1)?.createdAt ?? null;
    const lastOrderDate   = paidOrders.at(0)?.createdAt  ?? null;

    // Talla(s) favorita(s) por unidades compradas
    const sizeCount: Record<string, number> = {};
    for (const o of paidOrders) {
      for (const item of o.items) {
        if (item.variantSize)
          sizeCount[item.variantSize] = (sizeCount[item.variantSize] ?? 0) + item.quantity;
      }
    }
    const favoriteSizes = Object.entries(sizeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([size]) => size);

    // Club favorito (vía productos actuales — best effort)
    type ClubRow = { clubName: string };
    const clubRows = await prisma.$queryRaw<ClubRow[]>`
      SELECT cl.name AS "clubName", COUNT(*)::int AS cnt
      FROM   "OrderItem" oi
      JOIN   "Order"   o  ON o.id  = oi."orderId"
      JOIN   "Product" p  ON p.id  = oi."productId"
      JOIN   "Club"    cl ON cl.id = p."clubId"
      WHERE  o."userId" = ${id}
             AND o.status IN ('PAID','PROCESSING','SHIPPED','DELIVERED')
             AND oi."productId" IS NOT NULL
      GROUP  BY cl.name
      ORDER  BY cnt DESC
      LIMIT  1
    `;
    const favoriteClub = clubRows[0]?.clubName ?? null;

    return res.json({
      ...user,
      stats: {
        totalOrders,
        totalSpentCents,
        avgOrderValueCents: avgOrderCents,
        firstOrderDate,
        lastOrderDate,
        favoriteClub,
        favoriteSizes,
      },
      orders,
      notes,
      rewardHistory,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

/* ─── POST /api/v1/admin/crm/customers/:id/notes ──────────────────────────── */
router.post('/customers/:id/notes', requireAuth, async (req: Request, res: Response) => {
  if (!adminOnly(req, res)) return;

  const { id }  = req.params;
  const content = String(req.body.content || '').trim();

  if (!content)            return res.status(400).json({ error: 'La nota no puede estar vacía' });
  if (content.length > 1000) return res.status(400).json({ error: 'Nota demasiado larga (máx 1000 caracteres)' });

  try {
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) return res.status(404).json({ error: 'Cliente no encontrado' });

    const note = await prisma.customerNote.create({
      data: { userId: id, content },
      select: { id: true, content: true, createdAt: true },
    });
    return res.status(201).json(note);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

/* ─── PUT /api/v1/admin/crm/customers/:id/tags ────────────────────────────── */
router.put('/customers/:id/tags', requireAuth, async (req: Request, res: Response) => {
  if (!adminOnly(req, res)) return;

  const { id } = req.params;
  const { tags } = req.body;

  if (!Array.isArray(tags)) return res.status(400).json({ error: 'tags debe ser un array de strings' });

  const cleaned = [...new Set(
    (tags as unknown[])
      .filter((t): t is string => typeof t === 'string')
      .map(t => t.trim())
      .filter(Boolean),
  )].slice(0, 20); // máx 20 tags por cliente

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { customerTags: cleaned },
      select: { id: true, customerTags: true },
    });
    return res.json(updated);
  } catch {
    return res.status(500).json({ error: 'Error interno' });
  }
});

/* ─── DELETE /api/v1/admin/crm/customers/:id/notes/:noteId ───────────────── */
router.delete('/customers/:id/notes/:noteId', requireAuth, async (req: Request, res: Response) => {
  if (!adminOnly(req, res)) return;

  const { id, noteId } = req.params;

  try {
    const note = await prisma.customerNote.findFirst({ where: { id: noteId, userId: id } });
    if (!note) return res.status(404).json({ error: 'Nota no encontrada' });

    await prisma.customerNote.delete({ where: { id: noteId } });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

export default router;
