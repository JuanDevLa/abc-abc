
import { z } from 'zod';


export const JerseyStyleEnum = z.enum(['HOME', 'AWAY', 'THIRD', 'GK', 'SPECIAL']);
export const AudienceEnum = z.enum(['HOMBRE', 'MUJER', 'NINO']);
export const SleeveEnum = z.enum(['SHORT', 'LONG']);


export const SortEnum = z.enum(['newest', 'price-asc', 'price-desc']);


export const ListQuerySchema = z.object({
  // Filtros (sanitizados)
  club: z.string().trim().min(1).max(50).optional(),        // slug del club
  season: z.string().trim().min(1).max(20).optional(),      // code: "24/25" o "2025"
  style: JerseyStyleEnum.optional(),
  size: z.string().trim().min(1).max(10).optional(),
  audience: AudienceEnum.optional(),
  sleeve: SleeveEnum.optional(),

  // Rango de precios
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().positive().optional(),

  // Paginación
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(400).optional(),

  // Stock
  inStock: z.coerce.boolean().optional(),

  // Búsqueda (solo letras/números/espacios con acentos; ajusta si necesitas guiones, etc.)
  search: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/, { message: 'Solo letras, números y espacios permitidos' })
    .optional(),

  // Ordenamiento
  sort: SortEnum.default('newest'),
})
  .refine((d) => {
    if (d.minPrice !== undefined && d.maxPrice !== undefined) {
      return d.minPrice <= d.maxPrice;
    }
    return true;
  }, { message: 'minPrice must be <= maxPrice' });

/* ============================
   Crear producto
   - Acepta ID o Slug/Code (XOR) para club y season
============================ */
export const CreateProductSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/, { message: 'Solo minúsculas, números y guiones' }),
  description: z.string().trim().max(1000).optional().default(''),
  brand: z.string().trim().max(50).nullable().default(null),
  jerseyStyle: JerseyStyleEnum,
  authentic: z.boolean().optional().default(false),

  // Club: id O slug (excluyentes)
  clubId: z.string().uuid().optional(),
  clubSlug: z.string().trim().min(2).max(80).optional(),

  // Season: id O code (excluyentes)
  seasonId: z.string().uuid().optional(),
  seasonCode: z.string().trim().min(1).max(20).optional(),

  imageUrl: z.string().url().optional(),

  // Arreglo de variantes dinámicas
  variants: z.array(z.object({
    sku: z.string().trim().min(4).max(50),
    size: z.string().trim().min(1).max(10),
    color: z.string().trim().max(50).optional().nullable(),
    audience: AudienceEnum,
    sleeve: SleeveEnum,
    hasLeaguePatch: z.boolean().optional().default(false),
    hasChampionsPatch: z.boolean().optional().default(false),
    isPlayerVersion: z.boolean().optional().default(false),
    allowsNameNumber: z.boolean().optional().default(false),
    customizationPrice: z.number().int().nonnegative().optional().default(19900),
    isDropshippable: z.boolean().optional().default(true),
    priceCents: z.number().int().positive(),
    compareAtPriceCents: z.number().int().positive().optional().nullable(),
    costCents: z.number().int().nonnegative().default(0),
    currency: z.string().length(3).default('MXN'),
    stock: z.number().int().nonnegative().default(0),
    weightGrams: z.number().int().positive().optional().nullable(),
  })).optional(),

}).superRefine((data, ctx) => {
  // XOR club
  const hasClubId = !!data.clubId;
  const hasClubSlug = !!data.clubSlug;
  if (hasClubId === hasClubSlug) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debes enviar clubId (UUID) o clubSlug (slug), pero no ambos.',
      path: ['clubId'],
    });
  }

  // XOR season
  const hasSeasonId = !!data.seasonId;
  const hasSeasonCode = !!data.seasonCode;
  if (hasSeasonId === hasSeasonCode) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debes enviar seasonId (UUID) o seasonCode, pero no ambos.',
      path: ['seasonId'],
    });
  }
});

/* ============================
   Crear variante
============================ */
export const CreateVariantSchema = z.object({
  productId: z.string().uuid(), // (si quieres aceptar productSlug, lo añadimos luego)
  sku: z.string().trim().min(4).max(50),
  size: z.string().trim().min(1).max(10),
  audience: AudienceEnum,
  sleeve: SleeveEnum,
  hasLeaguePatch: z.boolean().optional().default(false),
  hasChampionsPatch: z.boolean().optional().default(false),
  allowsNameNumber: z.boolean().optional().default(false),
  customizationPrice: z.number().int().nonnegative().optional().default(19900),
  color: z.string().trim().max(50).optional().nullable(),
  isDropshippable: z.boolean().optional().default(true),
  priceCents: z.number().int().positive(),
  compareAtPriceCents: z.number().int().positive().optional().nullable(),
  costCents: z.number().int().nonnegative().default(0),
  currency: z.string().length(3).default('MXN'),
  stock: z.number().int().nonnegative().default(0),
  weightGrams: z.number().int().positive().optional().nullable(),
});

/* ============================
   Tipos inferidos
============================ */
export type ListQueryInput = z.infer<typeof ListQuerySchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type CreateVariantInput = z.infer<typeof CreateVariantSchema>;
