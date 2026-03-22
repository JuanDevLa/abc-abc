import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

/* ─── GET /seasons — Listar temporadas (público) ─── */
router.get('/seasons', async (_req: Request, res: Response) => {
    try {
        const seasons = await prisma.season.findMany({
            orderBy: { startYear: 'desc' },
            select: { id: true, code: true, startYear: true, endYear: true },
        });
        res.json(seasons);
    } catch (error) {
        console.error('Error al obtener temporadas:', error);
        res.status(500).json({ error: 'Error al obtener temporadas' });
    }
});

export default router;
