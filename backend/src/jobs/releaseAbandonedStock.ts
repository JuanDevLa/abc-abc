import { PrismaClient } from '@prisma/client';

const EXPIRY_HOURS = 12;

export async function releaseAbandonedStock(prisma: PrismaClient) {
  const cutoff = new Date(Date.now() - EXPIRY_HOURS * 60 * 60 * 1000);

  const abandonedOrders = await prisma.order.findMany({
    where: { status: 'PENDING_PAYMENT', createdAt: { lt: cutoff } },
    include: { items: true },
  });

  let cancelled = 0;
  let stockRecovered = 0;

  for (const order of abandonedOrders) {
    try {
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          if (!item.isDropshippable && item.variantId) {
            const variant = await tx.productVariant.findUnique({
              where: { id: item.variantId },
              select: { id: true },
            });
            if (variant) {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { increment: item.quantity } },
              });
              stockRecovered += item.quantity;
            }
          }
        }
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED' },
        });
        cancelled++;
      });
    } catch (err) {
      console.error(`[CRON] Error procesando orden ${order.orderNumber}:`, err);
    }
  }

  return { cancelled, stockRecovered };
}
