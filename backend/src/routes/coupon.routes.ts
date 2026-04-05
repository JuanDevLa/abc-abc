// src/routes/coupon.routes.ts
import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { validateCoupon } from '../services/coupon.service.js';

const router = Router();

const couponValidateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { valid: false, error: 'Demasiadas solicitudes. Intenta en un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ─── GET /coupons/announcement — cupón activo para el navbar ─── */
router.get('/coupons/announcement', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const coupon = await prisma.coupon.findFirst({
      where: {
        active: true,
        firstPurchaseOnly: true,
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        ],
      },
      select: { code: true, discountPercent: true, description: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json(coupon ?? null);
  } catch {
    res.json(null);
  }
});

/* ─── POST /coupons/validate ─── */
router.post('/coupons/validate', couponValidateLimiter, async (req: Request, res: Response) => {
  try {
    const { code, subtotalCents, email } = req.body;
    if (!code || typeof subtotalCents !== 'number' || !email) {
      return res.status(400).json({ valid: false, error: 'Datos incompletos' });
    }
    const result = await validateCoupon({ code, subtotalCents, email });
    if (!result.valid) {
      return res.json({ valid: false, error: 'Cupón inválido o no aplicable' });
    }
    res.json(result);
  } catch {
    res.status(500).json({ valid: false, error: 'Error al validar cupón' });
  }
});

/* ─── ADMIN routes ─── */

/* GET /admin/coupons */
router.get('/admin/coupons', requireAuth, async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { usages: true } } },
    });
    res.json(coupons);
  } catch {
    res.status(500).json({ error: 'Error al obtener cupones' });
  }
});

/* POST /admin/coupons */
router.post('/admin/coupons', requireAuth, async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const {
      code, description, discountPercent, minPurchaseCents,
      firstPurchaseOnly, usageLimit, startsAt, expiresAt, active,
    } = req.body;

    if (!code || typeof discountPercent !== 'number' || discountPercent < 1 || discountPercent > 100) {
      return res.status(400).json({ error: 'Código y porcentaje son requeridos (1-100)' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: String(code).toUpperCase().trim(),
        description: description ?? '',
        discountPercent,
        minPurchaseCents: minPurchaseCents ?? 0,
        firstPurchaseOnly: firstPurchaseOnly ?? false,
        usageLimit: usageLimit ?? null,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: active !== false,
      },
    });
    res.status(201).json(coupon);
  } catch (e: any) {
    if (e?.code === 'P2002') return res.status(409).json({ error: 'El código de cupón ya existe' });
    res.status(500).json({ error: 'Error al crear cupón' });
  }
});

/* PUT /admin/coupons/:id */
router.put('/admin/coupons/:id', requireAuth, async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const {
      code, description, discountPercent, minPurchaseCents,
      firstPurchaseOnly, usageLimit, startsAt, expiresAt, active,
    } = req.body;

    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: {
        ...(code !== undefined && { code: String(code).toUpperCase().trim() }),
        ...(description !== undefined && { description }),
        ...(discountPercent !== undefined && { discountPercent }),
        ...(minPurchaseCents !== undefined && { minPurchaseCents }),
        ...(firstPurchaseOnly !== undefined && { firstPurchaseOnly }),
        ...(usageLimit !== undefined && { usageLimit: usageLimit === null ? null : Number(usageLimit) }),
        ...(startsAt !== undefined && { startsAt: startsAt ? new Date(startsAt) : null }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        ...(active !== undefined && { active }),
      },
    });
    res.json(coupon);
  } catch (e: any) {
    if (e?.code === 'P2025') return res.status(404).json({ error: 'Cupón no encontrado' });
    if (e?.code === 'P2002') return res.status(409).json({ error: 'El código ya está en uso' });
    res.status(500).json({ error: 'Error al actualizar cupón' });
  }
});

/* DELETE /admin/coupons/:id */
router.delete('/admin/coupons/:id', requireAuth, async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e: any) {
    if (e?.code === 'P2025') return res.status(404).json({ error: 'Cupón no encontrado' });
    res.status(500).json({ error: 'Error al eliminar cupón' });
  }
});

export default router;
