// backend/src/lib/env.ts
import { z } from 'zod';

// Definición del esquema
const envSchema = z.object({
  // Base de datos
  DATABASE_URL: z.string().url().nonempty('DATABASE_URL es obligatoria'),

  // Clave para firmar JWTs (seguridad)
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET debe tener al menos 32 caracteres')
    .nonempty(),

  // Hash bcrypt del password de admin (generado con: node -e "require('bcrypt').hash('TU_PASSWORD',12).then(h=>console.log(h))")
  ADMIN_PASSWORD_HASH: z
    .string()
    .min(50, 'ADMIN_PASSWORD_HASH debe ser un hash bcrypt válido'),

  // Puerto del servidor
  PORT: z
    .string()
    .regex(/^\d+$/, 'PORT debe ser un número válido')
    .optional()
    .default('4000')
    .transform((val) => Number(val)),

  // Entorno (desarrollo, producción, etc.)
  NODE_ENV: z
    .enum(['development', 'production', 'test'] as const)
    .default('development'),

  // Dominios permitidos para CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // URL del frontend (para redirects de Stripe, emails, etc.)
  FRONTEND_URL: z.string().url('FRONTEND_URL debe ser una URL válida').optional(),

  // SMTP — necesario para envío de emails (confirmaciones, verificación)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().regex(/^\d+$/, 'SMTP_PORT debe ser un número').optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email('SMTP_FROM debe ser un email válido').optional(),

  // Stripe — necesario para procesar pagos
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // 17track — necesario para rastreo de paquetes
  TRACK17_API_KEY: z.string().optional(),
});


export const env = envSchema.parse(process.env);
