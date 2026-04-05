// backend/src/middlewares/errorHandler.ts
import type { Request, Response, NextFunction } from 'express';

type PrismaLikeError = { code?: string; meta?: unknown };
type ZodLikeError = { name?: string; flatten?: () => unknown };
type BodyParserError = { type?: string };

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // JSON inválido (body-parser)
  if ((err as BodyParserError)?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  // Validación Zod
  if ((err as ZodLikeError)?.name === 'ZodError') {
    const z = err as ZodLikeError;
    return res.status(400).json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR', details: z.flatten?.() });
  }

  // Prisma: unique constraint (slug, sku, etc.)
  if ((err as PrismaLikeError)?.code === 'P2002') {
    return res.status(409).json({ error: 'Recurso duplicado', code: 'CONFLICT' });
  }

  // Log del error no esperado
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Internal Server Error' });
}
