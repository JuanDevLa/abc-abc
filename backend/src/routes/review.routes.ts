// backend/src/routes/review.routes.ts
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { CreateReviewSchema } from '../validators/review.validator.js';

const router = Router();

/* ─────────────────────────────────────────────────────────
   GET /reviews — Público
   Devuelve reseñas verificadas con datos del producto.
   ?stars=5 filtra por rating. Orden inteligente:
   foto primero → 5★ → texto largo
   ───────────────────────────────────────────────────────── */
router.get('/reviews', async (req, res, next) => {
    try {
        const stars = req.query.stars ? Number(req.query.stars) : null;

        const where: any = { verified: true };
        if (stars && stars >= 1 && stars <= 5) {
            where.rating = stars;
        }

        const reviews = await prisma.review.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } },
                    },
                },
            },
        });

        // Orden inteligente: foto → 5★ → texto largo
        const sorted = [...reviews].sort((a: any, b: any) => {
            const aPhoto = a.image ? 1 : 0;
            const bPhoto = b.image ? 1 : 0;
            if (aPhoto !== bPhoto) return bPhoto - aPhoto;
            if (a.rating !== b.rating) return b.rating - a.rating;
            return (b.comment?.length || 0) - (a.comment?.length || 0);
        });

        res.json(sorted.map((r: any) => ({
            id: r.id,
            name: r.name,
            image: r.image || null,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
            productId: r.productId,
            product: r.product ? {
                id: r.product.id,
                name: r.product.name,
                slug: r.product.slug,
                imageUrl: r.product.images?.[0]?.url || null,
            } : null,
        })));
    } catch (error) {
        next(error);
    }
});

/* ─────────────────────────────────────────────────────────
   GET /reviews/stats — Público
   Distribución de ratings + promedio
   ───────────────────────────────────────────────────────── */
router.get('/reviews/stats', async (_req, res, next) => {
    try {
        const reviews = await prisma.review.findMany({
            where: { verified: true },
            select: { rating: true },
        });

        const byRating: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (const r of reviews) {
            byRating[r.rating] = (byRating[r.rating] || 0) + 1;
        }

        const total = reviews.length;
        const average = total > 0
            ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
            : 0;

        res.json({ total, average, byRating });
    } catch (error) {
        next(error);
    }
});

/* ─────────────────────────────────────────────────────────
   POST /reviews — Público
   Cualquiera puede enviar una reseña (verified: false).
   Requiere aprobación de admin.
   ───────────────────────────────────────────────────────── */
router.post('/reviews', async (req, res, next) => {
    try {
        const parsed = CreateReviewSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: parsed.error.flatten().fieldErrors,
            });
        }

        const { productId, name, rating, comment, image } = parsed.data;

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        await prisma.review.create({
            data: {
                productId,
                name: name.trim(),
                image: image ?? null,
                rating,
                comment: comment?.trim() ?? '',
                verified: false,
            },
        });

        res.status(201).json({
            message: '¡Gracias! Tu reseña será revisada y publicada pronto.',
        });
    } catch (error) {
        next(error);
    }
});

/* ─────────────────────────────────────────────────────────
   GET /products/:productId/reviews — Público
   Devuelve reseñas de un producto específico
   ───────────────────────────────────────────────────────── */
router.get('/products/:productId/reviews', async (req, res, next) => {
    try {
        const { productId } = req.params;

        const reviews = await prisma.review.findMany({
            where: { productId, verified: true },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        res.json(reviews.map((r: any) => ({
            id: r.id,
            name: r.name,
            image: r.image || null,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
        })));
    } catch (error) {
        next(error);
    }
});

/* ─────────────────────────────────────────────────────────
   POST /products/:productId/reviews — ADMIN ONLY
   Crear reseña manualmente desde el panel de administración
   ───────────────────────────────────────────────────────── */
router.post('/products/:productId/reviews', requireAuth, async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { name, image, rating, comment, createdAt } = req.body;

        if (!name || !rating) {
            return res.status(400).json({ error: 'Nombre y calificación son requeridos' });
        }

        const ratingNum = Number(rating);
        if (ratingNum < 1 || ratingNum > 5 || !Number.isInteger(ratingNum)) {
            return res.status(400).json({ error: 'La calificación debe ser un número entero entre 1 y 5' });
        }

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const review = await prisma.review.create({
            data: {
                productId,
                name: name.trim(),
                image: image || null,
                rating: ratingNum,
                comment: comment?.trim() || '',
                verified: true,
                ...(createdAt ? { createdAt: new Date(createdAt) } : {}),
            },
        });

        res.status(201).json({
            id: review.id,
            name: review.name,
            image: review.image,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
        });
    } catch (error) {
        next(error);
    }
});

/* ─────────────────────────────────────────────────────────
   DELETE /reviews/:id — ADMIN ONLY
   ───────────────────────────────────────────────────────── */
router.delete('/reviews/:id', requireAuth, async (req, res, next) => {
    try {
        await prisma.review.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

/* ─────────────────────────────────────────────────────────
   GET /admin/reviews — ADMIN ONLY
   Listar todas las reseñas con info de producto
   ───────────────────────────────────────────────────────── */
router.get('/admin/reviews', requireAuth, async (_req, res, next) => {
    try {
        const reviews = await prisma.review.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                product: { select: { id: true, name: true, slug: true } },
            },
            take: 200,
        });
        res.json(reviews);
    } catch (error) {
        next(error);
    }
});

/* ─────────────────────────────────────────────────────────
   PATCH /admin/reviews/:id/approve — ADMIN ONLY
   Aprueba una reseña (verified: true)
   ───────────────────────────────────────────────────────── */
router.patch('/admin/reviews/:id/approve', requireAuth, async (req, res, next) => {
    try {
        const review = await prisma.review.update({
            where: { id: req.params.id },
            data: { verified: true },
        });
        res.json({ success: true, id: review.id, verified: true });
    } catch (error) {
        next(error);
    }
});

/* ─────────────────────────────────────────────────────────
   PATCH /admin/reviews/:id/reject — ADMIN ONLY
   Rechaza una reseña (verified: false)
   ───────────────────────────────────────────────────────── */
router.patch('/admin/reviews/:id/reject', requireAuth, async (req, res, next) => {
    try {
        const review = await prisma.review.update({
            where: { id: req.params.id },
            data: { verified: false },
        });
        res.json({ success: true, id: review.id, verified: false });
    } catch (error) {
        next(error);
    }
});

export default router;
