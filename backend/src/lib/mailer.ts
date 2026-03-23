// backend/src/lib/mailer.ts
import * as nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  NODE_ENV,
} = process.env;

// Si faltan credenciales, usamos transporte que imprime el correo en consola
const useConsole =
  !SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM;

export const mailer = useConsole
  ? nodemailer.createTransport({ jsonTransport: true }) // imprime el “email” en consola (no envía)
  : nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: false,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

// ─── Tipos para el email de confirmación ───────────────────────────────────
interface OrderEmailItem {
  productName: string;
  variantSize?: string | null;
  variantColor?: string | null;
  quantity: number;
  unitPriceCents: number;
  productImageUrl?: string | null;
}

interface OrderEmailData {
  orderNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  shippingMethod: string;
  shippingCents: number;
  subtotalCents: number;
  totalCents: number;
  items: OrderEmailItem[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function formatMXN(cents: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100);
}

function shippingLabel(method: string): string {
  if (method === 'express') return 'Express (1–3 días hábiles)';
  if (method === 'free')    return 'Gratis (5–7 días hábiles)';
  return 'Estándar (3–5 días hábiles)';
}

// ─── Email de confirmación de orden ────────────────────────────────────────
export async function sendOrderConfirmationEmail(order: OrderEmailData) {
  const frontendUrl = process.env.FRONTEND_URL ?? 'https://jerseysraw.com';

  const itemsHtml = order.items.map(item => {
    const img = item.productImageUrl
      ? `<img src="${item.productImageUrl}" alt="${item.productName}" width="64" height="64"
             style="width:64px;height:64px;object-fit:cover;border-radius:6px;border:1px solid #2a2a2a;display:block;" />`
      : `<div style="width:64px;height:64px;background:#1a1a1a;border-radius:6px;border:1px solid #2a2a2a;"></div>`;

    const variant = [item.variantSize, item.variantColor].filter(Boolean).join(' · ');

    return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #1e1e1e;vertical-align:top;width:76px;">${img}</td>
        <td style="padding:12px 0 12px 12px;border-bottom:1px solid #1e1e1e;vertical-align:top;">
          <p style="margin:0 0 2px;color:#f0f0f0;font-size:14px;font-weight:600;">${item.productName}</p>
          ${variant ? `<p style="margin:0 0 4px;color:#888;font-size:12px;">${variant}</p>` : ''}
          <p style="margin:0;color:#888;font-size:12px;">Cantidad: ${item.quantity}</p>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #1e1e1e;vertical-align:top;text-align:right;white-space:nowrap;">
          <p style="margin:0;color:#F8C37C;font-size:14px;font-weight:700;">${formatMXN(item.unitPriceCents * item.quantity)}</p>
          ${item.quantity > 1 ? `<p style="margin:2px 0 0;color:#666;font-size:11px;">${formatMXN(item.unitPriceCents)} c/u</p>` : ''}
        </td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Confirmación de orden ${order.orderNumber}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#111111;border:1px solid #1e1e1e;border-radius:12px 12px 0 0;padding:32px 32px 24px;text-align:center;">
            <p style="margin:0 0 4px;font-size:28px;font-weight:900;letter-spacing:6px;color:#ffffff;">JERSEYS</p>
            <p style="margin:0;font-size:28px;font-weight:900;letter-spacing:6px;color:#F8C37C;">RAW</p>
            <div style="margin:20px auto 0;width:40px;height:2px;background:linear-gradient(90deg,transparent,#F8C37C,transparent);"></div>
          </td>
        </tr>

        <!-- Hero message -->
        <tr>
          <td style="background:#161616;border-left:1px solid #1e1e1e;border-right:1px solid #1e1e1e;padding:28px 32px 24px;text-align:center;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:4px;color:#F8C37C;text-transform:uppercase;">Pago confirmado</p>
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
              ¡Gracias, ${order.firstName}!
            </h1>
            <p style="margin:0;font-size:14px;color:#888888;line-height:1.6;">
              Tu orden <strong style="color:#F8C37C;">${order.orderNumber}</strong> ha sido confirmada y está siendo preparada.
            </p>
          </td>
        </tr>

        <!-- Order items -->
        <tr>
          <td style="background:#111111;border-left:1px solid #1e1e1e;border-right:1px solid #1e1e1e;padding:24px 32px;">
            <p style="margin:0 0 16px;font-size:11px;letter-spacing:3px;color:#666;text-transform:uppercase;">Productos</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${itemsHtml}
            </table>
          </td>
        </tr>

        <!-- Totals -->
        <tr>
          <td style="background:#111111;border-left:1px solid #1e1e1e;border-right:1px solid #1e1e1e;padding:0 32px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1e1e1e;padding-top:16px;">
              <tr>
                <td style="padding:5px 0;color:#888;font-size:13px;">Subtotal</td>
                <td style="padding:5px 0;color:#f0f0f0;font-size:13px;text-align:right;">${formatMXN(order.subtotalCents)}</td>
              </tr>
              <tr>
                <td style="padding:5px 0;color:#888;font-size:13px;">Envío — ${shippingLabel(order.shippingMethod)}</td>
                <td style="padding:5px 0;color:#f0f0f0;font-size:13px;text-align:right;">
                  ${order.shippingCents === 0 ? '<span style="color:#4ade80;">Gratis</span>' : formatMXN(order.shippingCents)}
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0 0;color:#ffffff;font-size:16px;font-weight:800;border-top:1px solid #2a2a2a;">Total</td>
                <td style="padding:12px 0 0;color:#F8C37C;font-size:18px;font-weight:800;text-align:right;border-top:1px solid #2a2a2a;">${formatMXN(order.totalCents)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Shipping address -->
        <tr>
          <td style="background:#161616;border-left:1px solid #1e1e1e;border-right:1px solid #1e1e1e;padding:24px 32px;">
            <p style="margin:0 0 12px;font-size:11px;letter-spacing:3px;color:#666;text-transform:uppercase;">Dirección de entrega</p>
            <p style="margin:0;color:#cccccc;font-size:13px;line-height:1.8;">
              ${order.firstName} ${order.lastName}<br>
              ${order.address}<br>
              ${order.city}, ${order.state} ${order.zipCode}<br>
              México
            </p>
          </td>
        </tr>

        <!-- CTA tracking -->
        <tr>
          <td style="background:#111111;border-left:1px solid #1e1e1e;border-right:1px solid #1e1e1e;padding:28px 32px;text-align:center;">
            <p style="margin:0 0 16px;color:#888;font-size:13px;">¿Quieres saber dónde está tu paquete?</p>
            <a href="${frontendUrl}/tracking"
               style="display:inline-block;background:#F8C37C;color:#0a0a0a;font-size:13px;font-weight:800;
                      letter-spacing:3px;text-transform:uppercase;text-decoration:none;
                      padding:14px 32px;border-radius:4px;">
              Rastrear mi orden
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0d0d0d;border:1px solid #1e1e1e;border-radius:0 0 12px 12px;padding:24px 32px;text-align:center;">
            <p style="margin:0 0 8px;color:#444;font-size:12px;">
              ¿Tienes dudas? Escríbenos a
              <a href="mailto:hola@jerseysraw.com" style="color:#F8C37C;text-decoration:none;">hola@jerseysraw.com</a>
            </p>
            <p style="margin:0;color:#333;font-size:11px;">
              © ${new Date().getFullYear()} Jerseys Raw · Todos los derechos reservados
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const info = await mailer.sendMail({
    from: `"Jerseys Raw" <${SMTP_FROM ?? 'no-reply@jerseysraw.com'}>`,
    to: order.email,
    subject: `✅ Orden confirmada ${order.orderNumber} — Jerseys Raw`,
    html,
  });

  if (useConsole || NODE_ENV === 'development') {
    console.log(`[MAIL] Confirmación enviada a ${order.email} — orden ${order.orderNumber}`);
  }
}

// ─── Email de notificación al admin — nueva orden pagada ───────────────────
export async function sendAdminOrderNotification(order: OrderEmailData) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return; // No configurado — silenciosamente ignorar

  const itemsList = order.items
    .map(i => `• ${i.productName} × ${i.quantity} — ${formatMXN(i.unitPriceCents * i.quantity)}`)
    .join('\n');

  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial;max-width:600px;">
      <h2 style="color:#F8C37C;">🛒 Nueva orden pagada: ${order.orderNumber}</h2>
      <p><strong>Cliente:</strong> ${order.firstName} ${order.lastName} (${order.email})</p>
      <p><strong>Envío a:</strong> ${order.address}, ${order.city}, ${order.state} ${order.zipCode}</p>
      <p><strong>Método de envío:</strong> ${order.shippingMethod}</p>
      <hr/>
      <pre style="background:#f5f5f5;padding:12px;border-radius:4px;">${itemsList}</pre>
      <hr/>
      <p><strong>Subtotal:</strong> ${formatMXN(order.subtotalCents)}</p>
      <p><strong>Envío:</strong> ${order.shippingCents === 0 ? 'Gratis' : formatMXN(order.shippingCents)}</p>
      <p style="font-size:18px;"><strong>Total: ${formatMXN(order.totalCents)}</strong></p>
    </div>
  `;

  await mailer.sendMail({
    from: SMTP_FROM || 'no-reply@jerseysraw.com',
    to: adminEmail,
    subject: `🛒 Nueva orden ${order.orderNumber} — ${formatMXN(order.totalCents)}`,
    html,
  });
}

export async function sendPasswordResetEmail(to: string, code: string) {
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial">
      <h2>Restablecer contraseña</h2>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
      <p>Tu código de verificación es:</p>
      <p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p>
      <p>Este código expira en 10 minutos.</p>
      <p>Si no solicitaste esto, puedes ignorar este correo.</p>
    </div>
  `;

  await mailer.sendMail({
    from: SMTP_FROM || 'no-reply@jerseysraw.com',
    to,
    subject: 'Restablece tu contraseña — Jerseys Raw',
    html,
  });

  if (useConsole || NODE_ENV === 'development') {
    console.log(`[MAIL] Reset de contraseña enviado a ${to} — código: ${code}`);
  }
}

export async function sendVerificationEmail(to: string, code: string) {
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial">
      <h2>Verifica tu correo</h2>
      <p>Tu código de verificación es:</p>
      <p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p>
      <p>Este código expira en 10 minutos.</p>
    </div>
  `;

  const info = await mailer.sendMail({
    from: SMTP_FROM || 'no-reply@example.com',
    to,
    subject: 'Verifica tu correo',
    html,
  });

  if (useConsole || NODE_ENV === 'development') {
    console.log(`[MAIL] Verificación enviada a ${to} — código: ${code}`);
  }
}
