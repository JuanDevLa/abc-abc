import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const router = Router();

const SubscribeSchema = z.object({
  email: z.string().email({ message: 'Correo inválido' }),
});

/* POST /api/v1/newsletter */
router.post('/newsletter', async (req, res) => {
  // Honeypot check: rechazar silenciosamente si contiene campos sospechosos
  if (req.body.phone || req.body.name || req.body.website) {
    return res.json({ success: true }); // Finge éxito para no alertar bots
  }

  const parsed = SubscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Correo inválido' });
  }

  const { email } = parsed.data;

  try {
    await (prisma as any).newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: { email },
    });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Error al suscribirse' });
  }
});

export default router;
