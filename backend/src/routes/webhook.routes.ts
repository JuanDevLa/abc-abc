// src/routes/webhook.routes.ts
// ⚠️  IMPORTANTE: Esta ruta DEBE montarse ANTES de express.json() en server.ts
//    porque Stripe necesita el body crudo (Buffer) para verificar la firma.

import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma.js';
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '../lib/mailer.js';

const router = Router();

// Inicializar Stripe (solo si la clave existe — evita crash en desarrollo sin config)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret  = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2026-02-25.clover' })
  : null;

/* ─── POST /api/webhooks/stripe ─── */
router.post(
  '/stripe',
  async (req: Request, res: Response) => {

    // Verificación rápida de configuración
    if (!stripe || !webhookSecret) {
      console.error('❌ Webhook: STRIPE_SECRET_KEY o STRIPE_WEBHOOK_SECRET no configurados.');
      return res.status(500).json({ error: 'Webhook no configurado en el servidor.' });
    }

    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      console.error('❌ Webhook: No se recibió header stripe-signature');
      return res.status(400).json({ error: 'Falta la firma stripe-signature.' });
    }

    let event: Stripe.Event;

    try {
      // ✅ REGLA DE SEGURIDAD: Verificar firma con el body CRUDO
      // Esto garantiza que el evento viene de Stripe, no de un tercero.
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
    } catch (err: any) {
      console.error('❌ Webhook: Firma inválida —', err.message);
      return res.status(400).json({ error: `Firma inválida: ${err.message}` });
    }

    // Procesar el evento ANTES de responder 200
    // (así si algo falla, Stripe recibe un 500 y lo reintenta)
    try {
      switch (event.type) {

        // ✅ REGLA DE SEGURIDAD: El estado PAID SOLO se actualiza aquí,
        // cuando Stripe confirma que los fondos ya fueron cobrados y verificados.
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;

          // Extraer el número de orden de los metadatos de la sesión
          const orderNumber = session.metadata?.orderNumber;

          if (!orderNumber) {
            console.error('❌ Webhook: checkout.session.completed SIN metadata.orderNumber');
            return res.status(400).json({ error: 'metadata.orderNumber faltante' });
          }

          // Verificar que el pago fue exitoso (no solo autorizado)
          if (session.payment_status !== 'paid') {
            console.warn(`⚠️  Sesión ${session.id} no está pagada aún (status: ${session.payment_status})`);
            return res.status(200).json({ received: true, note: 'payment_status not paid yet' });
          }

          // Actualizar la orden a PAID y obtener datos completos para el email
          let paidOrder: any;
          try {
            paidOrder = await prisma.order.update({
              where: { orderNumber },
              data: {
                status:    'PAID',
                expiresAt: null,
              },
              include: { items: true },
            });
          } catch (dbError) {
            console.error(`❌ Fallo al actualizar orden ${orderNumber} a PAID:`, dbError);
            return res.status(500).json({ error: 'Error al actualizar la orden' });
          }

          // Enviar emails (fire-and-forget — no bloquea la respuesta a Stripe)
          sendOrderConfirmationEmail(paidOrder).catch((emailErr) => {
            console.error(`⚠️  Email de confirmación fallido para orden ${orderNumber}:`, emailErr);
          });
          sendAdminOrderNotification(paidOrder).catch((emailErr) => {
            console.error(`⚠️  Email de notificación admin fallido para orden ${orderNumber}:`, emailErr);
          });

          break;
        }

        // Sesión expirada — cancelar orden y restaurar stock LOCAL
        case 'checkout.session.expired': {
          const session = event.data.object as Stripe.Checkout.Session;
          const expiredOrderNumber = session.metadata?.orderNumber;
          if (!expiredOrderNumber) break;

          const expiredOrder = await prisma.order.findUnique({
            where: { orderNumber: expiredOrderNumber },
            include: { items: true },
          });

          // Si ya fue procesada (pagada, cancelada, etc.) no hacer nada
          if (!expiredOrder || expiredOrder.status !== 'PENDING_PAYMENT') break;

          try {
            await prisma.$transaction(async (tx) => {
              for (const item of expiredOrder.items) {
                if (!item.isDropshippable && item.variantId) {
                  await tx.productVariant.update({
                    where: { id: item.variantId },
                    data: { stock: { increment: item.quantity } },
                  });
                }
              }
              await tx.order.update({
                where: { id: expiredOrder.id },
                data: { status: 'CANCELLED' },
              });
            });
          } catch (expiredErr) {
            console.error(`❌ Error cancelando orden expirada ${expiredOrderNumber}:`, expiredErr);
          }

          break;
        }

        default:
          break;
      }

      // Todo bien — responder 200
      return res.status(200).json({ received: true });

    } catch (processError) {
      console.error('❌ Error procesando evento del webhook:', processError);
      return res.status(500).json({ error: 'Error procesando el evento' });
    }
  }
);

export default router;
