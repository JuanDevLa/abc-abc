// backend/src/routes/search.routes.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

/**
 * GET /products/instant-search?q=...
 * Endpoint ultra-ligero para búsqueda instantánea.
 * Devuelve máximo 5 resultados con payload mínimo (~2KB).
 */
router.get('/products/instant-search', async (req: Request, res: Response) => {
    const q = (req.query.q as string || '').trim();

    if (q.length < 2) {
        return res.json([]);
    }

    try {
        const results = await prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { description: { contains: q, mode: 'insensitive' } },
                    { club: { name: { contains: q, mode: 'insensitive' } } },
                    { category: { name: { contains: q, mode: 'insensitive' } } },
                ],
            },
            select: {
                id: true,
                slug: true,
                name: true,
                images: { take: 1, select: { url: true }, orderBy: { sortOrder: 'asc' } },
                variants: { take: 1, select: { priceCents: true } },
                category: { select: { name: true } },
                club: { select: { name: true } },
            },
            take: 5,
        });

        // Aplanar para un payload aún más limpio
        const items = results.map(p => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            imageUrl: p.images[0]?.url || '',
            price: p.variants[0] ? p.variants[0].priceCents / 100 : 0,
            clubName: p.club?.name || null,
            categoryName: p.category?.name || null,
        }));

        res.json(items);
    } catch (error) {
        console.error('Instant search error:', error);
        res.status(500).json([]);
    }
});

export default router;
