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
import rewardsRoutes from './routes/rewards.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import stockRoutes from './routes/stock.routes.js';
import crmRoutes from './routes/crm.routes.js';
import newsletterRoutes from './routes/newsletter.routes.js';

const app = express();
app.set('trust proxy', 1);

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
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", 'https://js.stripe.com'],
      frameSrc:    ["'self'", 'https://js.stripe.com'],
      connectSrc:  ["'self'", 'https://api.stripe.com', 'https://res.cloudinary.com'],
      imgSrc:      ["'self'", 'data:', 'https://res.cloudinary.com'],
      styleSrc:    ["'self'", "'unsafe-inline'"],
      fontSrc:     ["'self'", 'data:'],
      objectSrc:   ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
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
app.use('/api/v1/admin/crm', crmRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', couponRoutes);
app.use('/api/v1', orderRoutes);
app.use('/api/v1', reviewRoutes);
app.use('/api/v1', analyticsRoutes);
app.use('/api/v1', shippingRoutes);
app.use('/api/v1', trackingRoutes);
app.use('/api/v1', rewardsRoutes);
app.use('/api/v1', stockRoutes);
app.use('/api/v1', newsletterRoutes);

/* ─── Error handling ─── */
app.use(errorHandler);
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

/* ─── Unhandled errors ─── */
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  process.exit(1);
});

/* ─── Start ─── */
const server = app.listen(env.PORT, () => {
  console.log(`API running on http://localhost:${env.PORT}`);
});

function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

/* ─── Cron: liberar stock de órdenes abandonadas (cada 30 min) ─── */
cron.schedule('*/30 * * * *', async () => {
  console.log('[CRON] Limpieza de stock abandonado...');
  const { cancelled, stockRecovered } = await releaseAbandonedStock(prisma);
  if (cancelled > 0) {
    console.log(`[CRON] ${cancelled} órdenes canceladas, ${stockRecovered} unidades recuperadas`);
  }
});