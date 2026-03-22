import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

/* ─── GET /categories — Listar categorías (público) ─── */
router.get('/categories', async (_req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
            select: { id: true, name: true, slug: true },
        });
        res.json(categories);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});

export default router;
