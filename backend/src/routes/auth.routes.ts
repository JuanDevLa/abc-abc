// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import { randomInt } from 'crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/mailer.js';
import { hashPassword, verifyPassword, generateToken, generateRefreshToken, getRefreshTokenExpiry } from '../lib/auth.js';
import { requireAuth } from '../middlewares/requireAuth.js';

/* ─── Rate limiter estricto para endpoints OTP (10 intentos / 15 min por IP) ─── */
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de inicio de sesión. Espera 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiados registros desde esta IP. Espera 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

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
  return randomInt(100000, 1000000).toString();
}

// POST /api/v1/auth/register
router.post('/register', registerLimiter, async (req, res, next) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors });
    const { email, password, name } = parsed.data;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      // Si ya está verificado, rechazar
      if (exists.emailVerifiedAt) return res.status(409).json({ error: 'El correo ya está registrado' });
      // Si no está verificado, reenviar código
      const code = genCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await prisma.verificationToken.create({
        data: { userId: exists.id, type: 'EMAIL_VERIFY', code, expiresAt },
      });
      await sendVerificationEmail(email, code);
      return res.status(200).json({ message: 'Te reenviamos el código de verificación. Revisa tu correo.' });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
    });

    // Bono de bienvenida: 500 puntos de recompensa
    await prisma.user.update({
      where: { id: user.id },
      data: {
        rewardPoints: 500,
        rewardHistory: {
          create: {
            type: 'EARN',
            points: 500,
            description: 'Bono de bienvenida — ¡Gracias por registrarte!',
          },
        },
      },
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
router.post('/verify-email', otpLimiter, async (req, res, next) => {
  try {
    const parsed = VerifyEmailSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors });
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
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors });
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    if (!user.emailVerifiedAt) {
      return res.status(403).json({ error: 'Debes verificar tu correo antes de iniciar sesión' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ error: 'Esta cuenta fue creada con Google. Usa el botón "Continuar con Google" para entrar.' });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = generateToken({ sub: user.id, role: user.role });
    const refreshToken = generateRefreshToken();
    const refreshTokenExp = getRefreshTokenExpiry();

    // Guardar refresh token en DB
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, refreshTokenExp },
    });

    return res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
      refreshToken,
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
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json(user);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/auth/me
const UpdateProfileSchema = z.object({
  name:  z.string().min(1).max(120).optional(),
  phone: z.string().max(20).optional().nullable(),
});

router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors });

    const updated = await prisma.user.update({
      where: { id: req.user!.sub },
      data: parsed.data,
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
    });
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', otpLimiter, async (req, res, next) => {
  try {
    const parsed = ForgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors });
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
router.post('/reset-password', otpLimiter, async (req, res, next) => {
  try {
    const parsed = ResetPasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors });
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

// POST /api/v1/auth/google
const GoogleAuthSchema = z.object({
  access_token: z.string().min(1),
});

router.post('/google', loginLimiter, async (req, res, next) => {
  try {
    const parsed = GoogleAuthSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Credencial inválida' });

    // Verificar el access token con Google y obtener info del usuario
    const tokenRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${parsed.data.access_token}` },
    });
    const payload = await tokenRes.json();

    if (!tokenRes.ok || payload.error) {
      return res.status(401).json({ error: 'Token de Google inválido o expirado' });
    }

    const { email, name, sub: googleId } = payload as { email: string; name?: string; sub: string };
    if (!email) return res.status(401).json({ error: 'No se pudo obtener el correo de Google' });

    // Buscar usuario por googleId o email
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    if (user) {
      // Vincular googleId si aún no estaba registrado (cuenta manual preexistente)
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, emailVerifiedAt: user.emailVerifiedAt ?? new Date() },
        });
      }
    } else {
      // Crear usuario nuevo — Google ya verificó el email
      user = await prisma.user.create({
        data: {
          email,
          name: name ?? null,
          googleId,
          emailVerifiedAt: new Date(),
          rewardPoints: 500,
          rewardHistory: {
            create: {
              type: 'EARN',
              points: 500,
              description: 'Bono de bienvenida — ¡Gracias por registrarte!',
            },
          },
        },
      });
    }

    const token = generateToken({ sub: user.id, role: user.role });
    const refreshToken = generateRefreshToken();
    const refreshTokenExp = getRefreshTokenExpiry();

    // Guardar refresh token en DB
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, refreshTokenExp },
    });

    return res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/refresh — Renovar access token usando refresh token
const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

router.post('/refresh', async (req, res, next) => {
  try {
    const parsed = RefreshSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Token requerido', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors });

    const { refreshToken } = parsed.data;

    // Buscar usuario con refresh token válido (no expirado)
    const user = await prisma.user.findFirst({
      where: {
        refreshToken,
        refreshTokenExp: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Refresh token inválido o expirado', code: 'UNAUTHORIZED' });
    }

    // Generar nuevo access token y rotar refresh token
    const newToken = generateToken({ sub: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenExp = getRefreshTokenExpiry();

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken, refreshTokenExp: newRefreshTokenExp },
    });

    return res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/logout — Invalidar refresh token
router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.sub },
      data: { refreshToken: null, refreshTokenExp: null },
    });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
