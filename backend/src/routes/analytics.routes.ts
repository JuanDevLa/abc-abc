// src/routes/analytics.routes.ts
import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { periodToDate, defaultGranularity } from '../lib/period.js';

const router = Router();

const viewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => false,
});

/* ─── POST /api/v1/analytics/view — Registrar visita de producto (público) ─── */
router.post('/analytics/view', viewLimiter, async (req: Request, res: Response) => {
  const { productId } = req.body;

  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ error: 'productId requerido' });
  }

  try {
    await prisma.productView.create({ data: { productId } });
    return res.status(200).json({ success: true });
  } catch {
    // Fallo silencioso — no interrumpir la experiencia del usuario
    return res.status(200).json({ ok: false });
  }
});

/* ─── GET /api/v1/analytics/abandoned — Carritos abandonados (admin) ─── */
router.get('/analytics/abandoned', requireAuth, async (_req: Request, res: Response) => {
  if (!adminOnly(_req, res)) return;
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
  if (!adminOnly(req, res)) return;
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
  if (!adminOnly(_req, res)) return;
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

/* ─────────────────────────────────────────────────────────────────────────────
   ESTADÍSTICAS DE PRODUCTOS
   Todos requieren rol admin.
───────────────────────────────────────────────────────────────────────────── */

const PAID_STATUSES = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;

function adminOnly(req: Request, res: Response): boolean {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }
  return true;
}

/* ─── GET /api/v1/analytics/products/top-viewed ─── */
router.get('/analytics/products/top-viewed', requireAuth, async (req: Request, res: Response) => {
  if (!adminOnly(req, res)) return;

  const since = periodToDate((req.query.period as string) || '30d');
  const lim   = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

  try {
    const grouped = await prisma.productView.groupBy({
      by: ['productId'],
      where: since ? { createdAt: { gte: since } } : {},
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: lim,
    });

    if (grouped.length === 0) return res.json({ items: [] });

    const productIds = grouped.map(g => g.productId);
    const products   = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true, name: true, slug: true,
        images: { take: 1, select: { url: true }, orderBy: { sortOrder: 'asc' } },
        club:   { select: { name: true } },
      },
    });

    const productMap = new Map(products.map(p => [p.id, p]));
    const items = grouped.map(g => {
      const p = productMap.get(g.productId);
      return {
        productId: g.productId,
        name:      p?.name      ?? '(producto eliminado)',
        slug:      p?.slug      ?? '',
        imageUrl:  p?.images[0]?.url ?? '',
        clubName:  p?.club?.name     ?? null,
        views:     g._count.productId,
      };
    });

    return res.json({ items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

/* ─── GET /api/v1/analytics/products/top-sold ─── */
router.get('/analytics/products/top-sold', requireAuth, async (req: Request, res: Response) => {
  if (!adminOnly(req, res)) return;

  const since = periodToDate((req.query.period as string) || '30d');
  const lim   = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

  try {
    const grouped = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        productId: { not: null },
        order: {
          status: { in: [...PAID_STATUSES] },
          ...(since ? { createdAt: { gte: since } } : {}),
        },
      },
      _sum: { quantity: true, totalCents: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: lim,
    });

    if (grouped.length === 0) return res.json({ items: [] });

    const productIds = grouped.map(g => g.productId!);
    const products   = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true, name: true, slug: true,
        images: { take: 1, select: { url: true }, orderBy: { sortOrder: 'asc' } },
        club:   { select: { name: true } },
      },
    });

    const productMap = new Map(products.map(p => [p.id, p]));
    const items = grouped.map(g => {
      const p = productMap.get(g.productId!);
      return {
        productId:    g.productId,
        name:         p?.name      ?? '(producto eliminado)',
        slug:         p?.slug      ?? '',
        imageUrl:     p?.images[0]?.url ?? '',
        clubName:     p?.club?.name     ?? null,
        totalSold:    g._sum?.quantity   ?? 0,
        revenueCents: g._sum?.totalCents ?? 0,
      };
    });

    return res.json({ items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

/* ─── GET /api/v1/analytics/products/least-viewed ─── */
router.get('/analytics/products/least-viewed', requireAuth, async (req: Request, res: Response) => {
  if (!adminOnly(req, res)) return;

  const since = periodToDate((req.query.period as string) || '30d');
  const lim   = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

  try {
    const sinceFilter = since
      ? Prisma.sql`WHERE "createdAt" >= ${since}`
      : Prisma.empty;

    type Row = { productId: string; name: string; slug: string; imageUrl: string; clubName: string | null; views: number };

    const items = await prisma.$queryRaw<Row[]>`
      SELECT p.id            AS "productId",
             p.name,
             p.slug,
             COALESCE(img.url, '')    AS "imageUrl",
             cl.name                 AS "clubName",
             COALESCE(v.cnt, 0)::int AS views
      FROM "Product" p
      LEFT JOIN (
        SELECT "productId", COUNT(*)::int AS cnt
        FROM   "ProductView"
        ${sinceFilter}
        GROUP  BY "productId"
      ) v   ON v."productId" = p.id
      LEFT JOIN LATERAL (
        SELECT url FROM "ProductImage"
        WHERE "productId" = p.id
        ORDER BY "sortOrder" ASC LIMIT 1
      ) img ON true
      LEFT JOIN "Club" cl ON cl.id = p."clubId"
      ORDER BY views ASC
      LIMIT   ${lim}
    `;

    return res.json({ items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

/* ─── GET /api/v1/analytics/products/least-sold ─── */
router.get('/analytics/products/least-sold', requireAuth, async (req: Request, res: Response) => {
  if (!adminOnly(req, res)) return;

  const since = periodToDate((req.query.period as string) || '30d');
  const lim   = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

  try {
    const sinceFilter = since
      ? Prisma.sql`AND o."createdAt" >= ${since}`
      : Prisma.empty;

    type Row = { productId: string; name: string; slug: string; imageUrl: string; clubName: string | null; totalSold: number; revenueCents: number };

    const items = await prisma.$queryRaw<Row[]>`
      SELECT p.id                    AS "productId",
             p.name,
             p.slug,
             COALESCE(img.url, '')   AS "imageUrl",
             cl.name                 AS "clubName",
             COALESCE(s.qty, 0)::int AS "totalSold",
             COALESCE(s.rev, 0)::int AS "revenueCents"
      FROM "Product" p
      LEFT JOIN (
        SELECT oi."productId",
               SUM(oi.quantity)::int    AS qty,
               SUM(oi."totalCents")::int AS rev
        FROM   "OrderItem" oi
        JOIN   "Order" o ON o.id = oi."orderId"
        WHERE  o.status IN ('PAID','PROCESSING','SHIPPED','DELIVERED')
               AND oi."productId" IS NOT NULL
               ${sinceFilter}
        GROUP  BY oi."productId"
      ) s   ON s."productId" = p.id
      LEFT JOIN LATERAL (
        SELECT url FROM "ProductImage"
        WHERE "productId" = p.id
        ORDER BY "sortOrder" ASC LIMIT 1
      ) img ON true
      LEFT JOIN "Club" cl ON cl.id = p."clubId"
      ORDER BY "totalSold" ASC
      LIMIT   ${lim}
    `;

    return res.json({ items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

/* ─── GET /api/v1/analytics/products/conversion ─── */
router.get('/analytics/products/conversion', requireAuth, async (req: Request, res: Response) => {
  if (!adminOnly(req, res)) return;

  const since = periodToDate((req.query.period as string) || '30d');
  const lim   = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const sort  = (req.query.sort as string) === 'worst' ? 'ASC' : 'DESC';

  try {
    const sinceViewsFilter  = since ? Prisma.sql`WHERE  "createdAt" >= ${since}` : Prisma.empty;
    const sinceOrdersFilter = since ? Prisma.sql`AND o."createdAt" >= ${since}`  : Prisma.empty;
    const orderDir = sort === 'ASC' ? Prisma.sql`ASC` : Prisma.sql`DESC`;

    type Row = {
      productId:      string;
      name:           string;
      slug:           string;
      imageUrl:       string;
      clubName:       string | null;
      views:          number;
      purchases:      number;
      conversionRate: number;
      revenueCents:   number;
    };

    const items = await prisma.$queryRaw<Row[]>`
      WITH views AS (
        SELECT "productId", COUNT(*)::int AS view_count
        FROM   "ProductView"
        ${sinceViewsFilter}
        GROUP  BY "productId"
      ),
      sales AS (
        SELECT oi."productId",
               SUM(oi.quantity)::int     AS sold,
               SUM(oi."totalCents")::int AS revenue
        FROM   "OrderItem" oi
        JOIN   "Order" o ON o.id = oi."orderId"
        WHERE  o.status IN ('PAID','PROCESSING','SHIPPED','DELIVERED')
               AND oi."productId" IS NOT NULL
               ${sinceOrdersFilter}
        GROUP  BY oi."productId"
      )
      SELECT p.id                            AS "productId",
             p.name,
             p.slug,
             COALESCE(img.url, '')           AS "imageUrl",
             cl.name                         AS "clubName",
             COALESCE(v.view_count, 0)::int  AS views,
             COALESCE(s.sold, 0)::int        AS purchases,
             CASE
               WHEN COALESCE(v.view_count, 0) > 0
               THEN ROUND(
                      COALESCE(s.sold, 0)::numeric / v.view_count * 100, 1
                    )
               ELSE 0
             END                             AS "conversionRate",
             COALESCE(s.revenue, 0)::int     AS "revenueCents"
      FROM   "Product" p
      LEFT JOIN views v   ON v."productId"  = p.id
      LEFT JOIN sales s   ON s."productId"  = p.id
      LEFT JOIN LATERAL (
        SELECT url FROM "ProductImage"
        WHERE "productId" = p.id
        ORDER BY "sortOrder" ASC LIMIT 1
      ) img ON true
      LEFT JOIN "Club" cl ON cl.id = p."clubId"
      WHERE  COALESCE(v.view_count, 0) > 0
      ORDER  BY "conversionRate" ${orderDir}
      LIMIT  ${lim}
    `;

    return res.json({ items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   MÉTRICAS HISTÓRICAS (FASE 2)
───────────────────────────────────────────────────────────────────────────── */

const STRIPE_PERCENT    = 0.036;
const STRIPE_FIXED_CENTS = 300;

/* ─── GET /api/v1/analytics/revenue/timeline ─── */
// ?period=7d|30d|90d|12m|all  &granularity=day|week|month
router.get('/analytics/revenue/timeline', requireAuth, async (req: Request, res: Response) => {
  if (!adminOnly(req, res)) return;

  const period = (req.query.period as string) || '30d';
  const since  = periodToDate(period);
  const rawGran = (req.query.granularity as string) || defaultGranularity(period);
  const gran   = ['day', 'week', 'month'].includes(rawGran) ? rawGran : 'day';

  try {
    const sinceFilter = since ? Prisma.sql`AND "createdAt" >= ${since}` : Prisma.empty;

    type TLRow = { date: Date; grossCents: number; orderCount: number };

    const rows = await prisma.$queryRaw<TLRow[]>`
      SELECT DATE_TRUNC(${gran}, "createdAt")::date AS date,
             SUM("totalCents")::int                 AS "grossCents",
             COUNT(*)::int                          AS "orderCount"
      FROM   "Order"
      WHERE  status IN ('PAID','PROCESSING','SHIPPED','DELIVERED')
             ${sinceFilter}
      GROUP  BY DATE_TRUNC(${gran}, "createdAt")
      ORDER  BY date ASC
    `;

    // Calcular net en JS (igual que el dashboard)
    const series = rows.map(r => {
      const gross = Number(r.grossCents);
      const count = Number(r.orderCount);
      const fees  = Math.round(gross * STRIPE_PERCENT) + STRIPE_FIXED_CENTS * count;
      return {
        date:        r.date,
        grossCents:  gross,
        netCents:    gross - fees,
        orderCount:  count,
      };
    });

    const totGross  = series.reduce((s, r) => s + r.grossCents, 0);
    const totOrders = series.reduce((s, r) => s + r.orderCount, 0);
    const totFees   = Math.round(totGross * STRIPE_PERCENT) + STRIPE_FIXED_CENTS * totOrders;

    return res.json({
      series,
      totals: {
        grossCents:    totGross,
        netCents:      totGross - totFees,
        orderCount:    totOrders,
        avgOrderCents: totOrders > 0 ? Math.round(totGross / totOrders) : 0,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

/* ─── GET /api/v1/analytics/orders/summary ─── */
// ?period=30d
router.get('/analytics/orders/summary', requireAuth, async (req: Request, res: Response) => {
  if (!adminOnly(req, res)) return;

  const since = periodToDate((req.query.period as string) || '30d');

  try {
    const sinceFilter = since ? Prisma.sql`AND o."createdAt" >= ${since}` : Prisma.empty;

    // 1. Conteo por status + avg ticket
    type StatusRow = { status: string; count: number; totalCents: number };
    const byStatus = await prisma.$queryRaw<StatusRow[]>`
      SELECT status, COUNT(*)::int AS count, COALESCE(SUM("totalCents"),0)::int AS "totalCents"
      FROM   "Order" o
      WHERE  1=1 ${sinceFilter}
      GROUP  BY status
    `;

    const statusMap: Record<string, number> = {};
    let totalOrders = 0;
    let totalRevenue = 0;
    for (const row of byStatus) {
      statusMap[row.status] = Number(row.count);
      totalOrders  += Number(row.count);
      totalRevenue += Number(row.totalCents);
    }

    const paidCount = (statusMap['PAID'] ?? 0) + (statusMap['PROCESSING'] ?? 0)
                    + (statusMap['SHIPPED'] ?? 0) + (statusMap['DELIVERED'] ?? 0);

    // 2. Fulfillment breakdown (por orden: DROPSHIPPING si algún item lo es)
    type FulfRow = { hasDropshipping: boolean; count: number };
    const fulfillment = await prisma.$queryRaw<FulfRow[]>`
      SELECT BOOL_OR(oi."isDropshippable") AS "hasDropshipping",
             COUNT(DISTINCT o.id)::int     AS count
      FROM   "Order" o
      JOIN   "OrderItem" oi ON oi."orderId" = o.id
      WHERE  o.status IN ('PAID','PROCESSING','SHIPPED','DELIVERED')
             ${sinceFilter}
      GROUP  BY o.id
    `;
    let localCount = 0;
    let dropCount  = 0;
    for (const row of fulfillment) {
      if (row.hasDropshipping) dropCount++; else localCount++;
    }

    // 3. Tasa de repeat customers (usuarios con >1 orden pagada de todos los tiempos)
    type RepeatRow = { total: number; repeat: number };
    const [repeatData] = await prisma.$queryRaw<RepeatRow[]>`
      SELECT COUNT(*)::int                                       AS total,
             COUNT(*) FILTER (WHERE order_count > 1)::int       AS repeat
      FROM (
        SELECT "userId", COUNT(*) AS order_count
        FROM   "Order"
        WHERE  status IN ('PAID','PROCESSING','SHIPPED','DELIVERED')
               AND "userId" IS NOT NULL
        GROUP  BY "userId"
      ) t
    `;
    const repeatRate = repeatData.total > 0
      ? Math.round((Number(repeatData.repeat) / Number(repeatData.total)) * 100 * 10) / 10
      : 0;

    return res.json({
      total:          totalOrders,
      paidTotal:      paidCount,
      byStatus:       statusMap,
      avgOrderCents:  paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0,
      repeatCustomerRate: repeatRate,
      fulfillmentBreakdown: { LOCAL: localCount, DROPSHIPPING: dropCount },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

/* ─── GET /api/v1/analytics/customers/summary ─── */
// ?period=30d
router.get('/analytics/customers/summary', requireAuth, async (req: Request, res: Response) => {
  if (!adminOnly(req, res)) return;

  const period = (req.query.period as string) || '30d';
  const since  = periodToDate(period);

  try {
    const sinceFilter      = since ? Prisma.sql`AND u."createdAt" >= ${since}` : Prisma.empty;
    const sinceOrderFilter = since ? Prisma.sql`AND o."createdAt" >= ${since}` : Prisma.empty;

    // 1. Total clientes, nuevos en período
    type CountRow = { total: number; newInPeriod: number };
    const [counts] = await prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*)::int                                                   AS total,
             COUNT(*) FILTER (WHERE 1=1 ${sinceFilter})::int                AS "newInPeriod"
      FROM   "User" u
      WHERE  u.role = 'CUSTOMER'
    `;

    // 2. Clientes con compras en el período que también compraron ANTES (returning)
    const returningFilter = since ? Prisma.sql`AND o."createdAt" >= ${since}` : Prisma.empty;
    type RetRow = { returning: number };
    const [retData] = since
      ? await prisma.$queryRaw<RetRow[]>`
          SELECT COUNT(DISTINCT u.id)::int AS returning
          FROM   "User" u
          WHERE  EXISTS (
            SELECT 1 FROM "Order" o
            WHERE  o."userId" = u.id
                   AND o.status IN ('PAID','PROCESSING','SHIPPED','DELIVERED')
                   ${returningFilter}
          )
          AND EXISTS (
            SELECT 1 FROM "Order" o
            WHERE  o."userId" = u.id
                   AND o.status IN ('PAID','PROCESSING','SHIPPED','DELIVERED')
                   AND o."createdAt" < ${since}
          )
        `
      : [{ returning: 0 }];

    // 3. Avg lifetime value (total gastado por usuario con al menos 1 orden)
    type LTVRow = { avgLtv: number };
    const [ltvData] = await prisma.$queryRaw<LTVRow[]>`
      SELECT COALESCE(AVG(total_spent), 0)::int AS "avgLtv"
      FROM (
        SELECT "userId", SUM("totalCents") AS total_spent
        FROM   "Order"
        WHERE  status IN ('PAID','PROCESSING','SHIPPED','DELIVERED')
               AND "userId" IS NOT NULL
        GROUP  BY "userId"
      ) t
    `;

    // 4. Top segmentos por tag (usando unnest sobre el array de Postgres)
    type TagRow = { tag: string; count: number };
    const topSegments = await prisma.$queryRaw<TagRow[]>`
      SELECT t.tag, COUNT(*)::int AS count
      FROM   "User" u
      CROSS  JOIN LATERAL unnest(u."customerTags") AS t(tag)
      GROUP  BY t.tag
      ORDER  BY count DESC
      LIMIT  10
    `;

    return res.json({
      totalCustomers:        Number(counts.total),
      newCustomers:          Number(counts.newInPeriod),
      returningCustomers:    Number(retData.returning),
      avgLifetimeValueCents: Number(ltvData.avgLtv),
      topSegments,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

export default router;
