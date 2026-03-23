// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/mailer.js';
import { hashPassword, verifyPassword, generateToken } from '../lib/auth.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

// Schemas
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120).optional(),
});

const VerifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6).regex(/^\d+$/),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6).regex(/^\d+$/, 'El código debe ser de 6 dígitos'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

// Helpers
function genCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/v1/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { email, password, name } = parsed.data;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'El correo ya está registrado' });

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
    });

    const code = genCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await prisma.verificationToken.create({
      data: { userId: user.id, type: 'EMAIL_VERIFY', code, expiresAt },
    });

    await sendVerificationEmail(email, code);
    return res.status(201).json({ message: 'Usuario creado. Revisa tu correo para verificar.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/verify-email
router.post('/verify-email', async (req, res, next) => {
  try {
    const parsed = VerifyEmailSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { email, code } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const token = await prisma.verificationToken.findFirst({
      where: { userId: user.id, type: 'EMAIL_VERIFY', code, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!token) return res.status(400).json({ error: 'Código inválido o ya utilizado' });
    if (token.expiresAt < new Date()) return res.status(400).json({ error: 'Código expirado' });

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      }),
      prisma.verificationToken.update({
        where: { id: token.id },
        data: { consumedAt: new Date() },
      }),
    ]);

    return res.json({ message: 'Correo verificado correctamente' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    if (!user.emailVerifiedAt) {
      return res.status(403).json({ error: 'Debes verificar tu correo antes de iniciar sesión' });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = generateToken({ sub: user.id, role: user.role });
    return res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json(user);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const parsed = ForgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { email } = parsed.data;

    // Siempre responder 200 aunque el email no exista (previene enumeración de usuarios)
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(200).json({ message: 'Si el correo existe, recibirás un código en breve.' });

    const code = genCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Invalidar tokens previos de reset para este usuario
    await prisma.verificationToken.updateMany({
      where: { userId: user.id, type: 'PASSWORD_RESET', consumedAt: null },
      data: { consumedAt: new Date() },
    });

    await prisma.verificationToken.create({
      data: { userId: user.id, type: 'PASSWORD_RESET', code, expiresAt },
    });

    await sendPasswordResetEmail(email, code);
    return res.status(200).json({ message: 'Si el correo existe, recibirás un código en breve.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const parsed = ResetPasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { email, code, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Código inválido o expirado' });

    const token = await prisma.verificationToken.findFirst({
      where: { userId: user.id, type: 'PASSWORD_RESET', code, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!token) return res.status(400).json({ error: 'Código inválido o ya utilizado' });
    if (token.expiresAt < new Date()) return res.status(400).json({ error: 'Código expirado' });

    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.verificationToken.update({
        where: { id: token.id },
        data: { consumedAt: new Date() },
      }),
    ]);

    return res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
});

export default router;
