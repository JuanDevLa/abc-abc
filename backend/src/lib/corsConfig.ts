// backend/src/lib/corsConfig.ts
import { type CorsOptions } from 'cors';

/**
 * Default origins always allowed (dev + production).
 * Additional origins can be added via the CORS_ORIGIN env var (comma-separated).
 */
const DEFAULT_ORIGINS = [
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : []),
  'https://jerseysraw.com',
  'https://www.jerseysraw.com',
];

function getAllowedOrigins(): string[] {
  const extraOrigins = process.env.CORS_ORIGIN;
  if (!extraOrigins) return DEFAULT_ORIGINS;

  const extras = extraOrigins.split(',').map(o => o.trim()).filter(Boolean);
  return [...DEFAULT_ORIGINS, ...extras];
}

export const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (curl, postman, server-to-server)
    if (!origin) return callback(null, true);

    const allowed = getAllowedOrigins();
    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
