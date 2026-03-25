import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.productVariant.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(p.map(x => ({
    id: x.id,
    sku: x.sku,
    priceCents: x.priceCents,
    compareAtPriceCents: x.compareAtPriceCents
  })), null, 2));
}

main().finally(() => prisma.$disconnect());
