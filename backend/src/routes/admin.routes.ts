// src/routes/admin.routes.ts
import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { generateToken } from '../lib/auth.js';
import { env } from '../lib/env.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { generateOrderPDF, generateReportPDF } from '../services/pdf.service.js';
import { getRewardConfig } from '../services/rewards.service.js';

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

/* ─── GET /admin/customers ─── */
router.get('/customers', requireAuth, async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const page  = Math.max(1, Number(req.query.page)  || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const skip  = (page - 1) * limit;
  const search = String(req.query.search || '').trim();

  const where = search
    ? { OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { name:  { contains: search, mode: 'insensitive' as const } },
      ] }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerifiedAt: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    items: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

/* ─── GET /admin/customers/:id ─── */
router.get('/customers/:id', requireAuth, async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerifiedAt: true,
      createdAt: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalCents: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
});

router.post('/login', adminLoginLimiter, async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Contraseña requerida' });
  }

  try {
    const isValid = await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);

    if (!isValid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = generateToken({ sub: 'admin', role: 'admin' });
    res.json({ token, message: 'Login exitoso' });
  } catch (error) {
    console.error('Error al verificar contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/* ─── GET /admin/orders/report/pdf?from=YYYY-MM-DD&to=YYYY-MM-DD — Reporte de período ─── */
// ⚠️ DEBE ir ANTES de /orders/:id/pdf para que Express no interprete "report" como :id
router.get('/orders/report/pdf', requireAuth, async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const { from, to } = req.query as { from?: string; to?: string };
  if (!from || !to) return res.status(400).json({ error: 'Se requieren los parámetros from y to (YYYY-MM-DD)' });

  const fromDate = new Date(from);
  const toDate   = new Date(to);
  toDate.setHours(23, 59, 59, 999); // Incluir todo el día final

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return res.status(400).json({ error: 'Fechas inválidas' });
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
        status: { not: 'PENDING_PAYMENT' },
      },
      include: {
        items: {
          select: { productName: true, quantity: true, totalCents: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const buffer = await generateReportPDF(orders, from, to);
    const filename = `reporte-${from}-${to}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch {
    res.status(500).json({ error: 'Error generando reporte PDF' });
  }
});

/* ─── GET /admin/orders/:id/pdf — PDF de una sola orden ─── */
router.get('/orders/:id/pdf', requireAuth, async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    const buffer = await generateOrderPDF(order);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="orden-${order.orderNumber}.pdf"`);
    res.send(buffer);
  } catch {
    res.status(500).json({ error: 'Error generando PDF' });
  }
});

/* ─── GET /admin/rewards/stats ─── */
router.get('/rewards/stats', requireAuth, async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const [totalPointsResult, totalUsers] = await Promise.all([
      prisma.user.aggregate({ _sum: { rewardPoints: true } }),
      prisma.user.count({ where: { rewardPoints: { gt: 0 } } }),
    ]);
    res.json({
      totalPoints: totalPointsResult._sum.rewardPoints ?? 0,
      totalUsers,
    });
  } catch {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

/* ─── GET /admin/rewards/config ─── */
router.get('/rewards/config', requireAuth, async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const config = await getRewardConfig();
    res.json(config);
  } catch {
    res.status(500).json({ error: 'Error al obtener configuración de recompensas' });
  }
});

/* ─── PUT /admin/rewards/config ─── */
router.put('/rewards/config', requireAuth, async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const { enabled, centsPerPoint, pointValueCents, goalPoints } = req.body;
    const config = await prisma.rewardConfig.upsert({
      where: { id: 1 },
      create: {
        enabled:         typeof enabled         === 'boolean' ? enabled         : true,
        centsPerPoint:   typeof centsPerPoint   === 'number'  ? centsPerPoint   : 400,
        pointValueCents: typeof pointValueCents === 'number'  ? pointValueCents : 100,
        goalPoints:      typeof goalPoints      === 'number'  ? goalPoints      : 550,
      },
      update: {
        ...(typeof enabled         === 'boolean' && { enabled }),
        ...(typeof centsPerPoint   === 'number'  && { centsPerPoint }),
        ...(typeof pointValueCents === 'number'  && { pointValueCents }),
        ...(typeof goalPoints      === 'number'  && { goalPoints }),
      },
    });
    res.json(config);
  } catch {
    res.status(500).json({ error: 'Error al actualizar configuración de recompensas' });
  }
});

export default router;
