import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import { prisma } from './lib/prisma.js';
import { corsOptions } from './lib/corsConfig.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { env } from './lib/env.js';
import { releaseAbandonedStock } from './jobs/releaseAbandonedStock.js';

// Route imports
import productRoutes from './routes/product.routes.js';
import clubRoutes from './routes/club.routes.js';
import leagueRoutes from './routes/league.routes.js';
import tagRoutes from './routes/tag.routes.js';
import categoryRoutes from './routes/category.routes.js';
import seasonRoutes from './routes/season.routes.js';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import orderRoutes from './routes/order.routes.js';
import reviewRoutes from './routes/review.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import searchRoutes from './routes/search.routes.js';
import shippingRoutes from './routes/shipping.routes.js';
import trackingRoutes from './routes/tracking.routes.js';

const app = express();

/* ─── Webhook de Stripe (ANTES de express.json) ─── */
// Stripe necesita el body crudo (Buffer) para verificar la firma HMAC.
// Si express.json() se ejecuta primero, la verificación falla con 400.
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

/* ─── Seguridad / middlewares ─── */
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  contentSecurityPolicy: false,
}));

app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

/* ─── Health check ─── */
app.get('/healthz', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: 'up' });
  } catch {
    res.status(500).json({ ok: false, db: 'down' });
  }
});

/* ─── API Routes ─── */
// searchRoutes PRIMERO: /products/instant-search debe evaluarse
// ANTES del comodín /products/:idOrSlug de productRoutes
app.use('/api/v1', searchRoutes);
app.use('/api/v1', productRoutes);
app.use('/api/v1', clubRoutes);
app.use('/api/v1', leagueRoutes);
app.use('/api/v1', tagRoutes);
app.use('/api/v1', categoryRoutes);
app.use('/api/v1', seasonRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', orderRoutes);
app.use('/api/v1', reviewRoutes);
app.use('/api/v1', analyticsRoutes);
app.use('/api/v1', shippingRoutes);
app.use('/api/v1', trackingRoutes);

/* ─── Error handling ─── */
app.use(errorHandler);
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

/* ─── Start ─── */
app.listen(env.PORT, () => {
  console.log(`API running on http://localhost:${env.PORT}`);
});

/* ─── Cron: liberar stock de órdenes abandonadas (cada 30 min) ─── */
cron.schedule('*/30 * * * *', async () => {
  console.log('[CRON] Limpieza de stock abandonado...');
  const { cancelled, stockRecovered } = await releaseAbandonedStock(prisma);
  if (cancelled > 0) {
    console.log(`[CRON] ${cancelled} órdenes canceladas, ${stockRecovered} unidades recuperadas`);
  }
});