// backend/scripts/release-abandoned-stock.ts
// ─────────────────────────────────────────────
// Libera el stock reservado por órdenes PENDING_PAYMENT que llevan más
// de 12 horas sin pagarse.
//
// Ejecutar con:
//   npx tsx scripts/release-abandoned-stock.ts
// ─────────────────────────────────────────────

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { releaseAbandonedStock } from '../src/jobs/releaseAbandonedStock.js';

const prisma = new PrismaClient();

releaseAbandonedStock(prisma)
  .then(({ cancelled, stockRecovered }) => {
    console.log(`Canceladas: ${cancelled} | Stock recuperado: ${stockRecovered} unidades`);
  })
  .catch(console.error)
  .finally(() => prisma.$disconnect());
