// backend/src/routes/product.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ProductController } from '../controllers/product.controller.js';
import { ProductService } from '../services/product.service.js';
import { ProductRepository } from '../repositories/product.repository.js';
import { requireAuth } from '../middlewares/requireAuth.js';

// Dependency Injection
const repository = new ProductRepository();
const service = new ProductService(repository);
const controller = new ProductController(service);

const router = Router();

/* ─────────────────────────────────────────────────────────
   READ ROUTES (Públicas)
   ───────────────────────────────────────────────────────── */

// GET /products — Lista con paginación y filtros avanzados
router.get('/products', async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // ─── Parámetros de filtro ───
        const search = req.query.search as string | undefined;
        const sizesRaw = req.query.sizes as string | undefined;
        const leaguesRaw = req.query.leagues as string | undefined;
        const gendersRaw = req.query.genders as string | undefined;
        const colorsRaw = req.query.colors as string | undefined;
        const sleevesRaw = req.query.sleeves as string | undefined;
        const clubSlug = req.query.club as string | undefined;
        const tagsRaw = req.query.tags as string | undefined;
        const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
        const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
        const sort = req.query.sort as string | undefined;

        // ─── Construir WHERE dinámico ───
        const where: any = {};

        // Búsqueda por nombre o descripción
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Filtro por tallas, género, color, precio (todos en variantes)
        // Construimos un solo objeto variantFilter para combinarlos
        const variantFilter: any = {};

        if (sizesRaw) {
            const sizes = sizesRaw.split(',').map(s => s.trim()).filter(Boolean);
            if (sizes.length > 0) variantFilter.size = { in: sizes };
        }

        if (gendersRaw) {
            const genders = gendersRaw.split(',').map(s => s.trim()).filter(Boolean);
            if (genders.length > 0) variantFilter.audience = { in: genders };
        }

        if (colorsRaw) {
            const colors = colorsRaw.split(',').map(s => s.trim()).filter(Boolean);
            if (colors.length > 0) variantFilter.color = { in: colors, mode: 'insensitive' };
        }

        if (sleevesRaw) {
            const sleeves = sleevesRaw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
            if (sleeves.length > 0) variantFilter.sleeve = { in: sleeves };
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            const priceFilter: any = {};
            if (minPrice !== undefined) priceFilter.gte = minPrice;
            if (maxPrice !== undefined) priceFilter.lte = maxPrice;
            variantFilter.priceCents = priceFilter;
        }

        if (Object.keys(variantFilter).length > 0) {
            where.variants = { some: variantFilter };
        }

        // Filtro por ligas (busca vía club → league slug)
        if (leaguesRaw) {
            const leagues = leaguesRaw.split(',').map(s => s.trim()).filter(Boolean);
            if (leagues.length > 0) {
                where.club = { ...where.club, league: { slug: { in: leagues } } };
            }
        }

        // Filtro por club (single slug para team pages, o múltiples para catálogo)
        const clubsRaw = req.query.clubs as string | undefined;
        if (clubsRaw) {
            const clubSlugs = clubsRaw.split(',').map(s => s.trim()).filter(Boolean);
            if (clubSlugs.length > 0) {
                where.club = { ...where.club, slug: { in: clubSlugs } };
            }
        } else if (clubSlug) {
            where.club = { ...where.club, slug: clubSlug };
        }

        // Filtro por tags (Estilos)
        if (tagsRaw) {
            const tags = tagsRaw.split(',').map(s => s.trim()).filter(Boolean);
            if (tags.length > 0) {
                where.tags = { some: { tag: { slug: { in: tags } } } };
            }
        }

        // ─── OrderBy dinámico ───
        let orderBy: any = { createdAt: 'desc' }; // default: newest
        if (sort === 'price_asc') orderBy = { variants: { _min: { priceCents: 'asc' } } };
        else if (sort === 'price_desc') orderBy = { variants: { _min: { priceCents: 'desc' } } };
        else if (sort === 'name_asc') orderBy = { name: 'asc' };
        else if (sort === 'newest') orderBy = { createdAt: 'desc' };

        const [totalCount, products] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                include: { images: true, category: true, variants: true, tags: true },
                orderBy,
            }),
        ]);

        const items = products.map(p => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            imageUrl: p.images[0]?.url || null,
            images: p.images,
            variants: p.variants,
            price: p.variants[0] ? p.variants[0].priceCents / 100 : 0,
            compareAtPrice: p.variants[0]?.compareAtPriceCents
                ? p.variants[0].compareAtPriceCents / 100
                : null,
            stock: p.variants[0]?.stock || 0,
            brand: p.brand || 'Oficial',
            category: p.category,
        }));

        res.json({
            items,
            pagination: {
                total: totalCount,
                page,
                totalPages: Math.ceil(totalCount / limit),
            },
        });
    } catch (error) {
        next(error);
    }
});

// GET /products/:idOrSlug — Obtener producto por UUID o slug
router.get('/products/:idOrSlug', async (req, res, next) => {
    try {
        const { idOrSlug } = req.params;

        // Intentar buscar por slug primero (más común en URLs)
        let product = await prisma.product.findUnique({
            where: { slug: idOrSlug },
            include: { 
                images: { orderBy: { sortOrder: 'asc' } }, 
                variants: true, 
                tags: true,
                category: true,
                club: { include: { league: true } }
            },
        });

        // Si no se encontró por slug, intentar por UUID
        if (!product) {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
            if (isUUID) {
                product = await prisma.product.findUnique({
                    where: { id: idOrSlug },
                    include: { 
                        images: { orderBy: { sortOrder: 'asc' } }, 
                        variants: true, 
                        tags: true,
                        category: true,
                        club: { include: { league: true } }
                    },
                });
            }
        }

        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const formatted = {
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            brand: product.brand,
            categoryId: product.categoryId,
            category: product.category, // NUEVO
            clubId: product.clubId,
            club: product.club, // NUEVO
            imageUrl: product.images[0]?.url || '',
            images: product.images.map(img => ({ id: img.id, url: img.url, sortOrder: img.sortOrder })),
            price: product.variants[0] ? product.variants[0].priceCents / 100 : 0,
            compareAtPrice: product.variants[0]?.compareAtPriceCents
                ? product.variants[0].compareAtPriceCents / 100
                : null,
            gender: product.variants[0]?.audience || 'HOMBRE',
            type: 'STADIUM',
            tagIds: product.tags.map(t => t.tagId),
            variants: product.variants.map(v => ({
                id: v.id,
                sku: v.sku,
                size: v.size,
                color: v.color,
                audience: v.audience,
                sleeve: v.sleeve,
                isPlayerVersion: v.isPlayerVersion,
                hasLeaguePatch: v.hasLeaguePatch,
                hasChampionsPatch: v.hasChampionsPatch,
                stock: v.stock,
                priceCents: v.priceCents,
                compareAtPriceCents: v.compareAtPriceCents,
                isDropshippable: v.isDropshippable,
                allowsNameNumber: v.allowsNameNumber,
                customizationPrice: v.customizationPrice,
            })),
            tags: product.tags,
        };

        res.json(formatted);
    } catch (error) {
        next(error);
    }
});

/* ─────────────────────────────────────────────────────────
   WRITE ROUTES (Protegidas con requireAuth)
   ───────────────────────────────────────────────────────── */

// POST /products — Crear
router.post('/products', requireAuth, async (req, res, next) => {
    try {
        // Resolver categoría
        let validCategoryId = req.body.categoryId;
        if (!validCategoryId || validCategoryId.length < 10) {
            let defaultCat = await prisma.category.findFirst({ where: { slug: 'general' } });
            if (!defaultCat) {
                defaultCat = await prisma.category.create({ data: { name: 'General', slug: 'general' } });
            }
            validCategoryId = defaultCat.id;
        }

        // Resolver temporada
        let defaultSeason = await prisma.season.findFirst({ where: { code: '24-25' } });
        if (!defaultSeason) {
            defaultSeason = await prisma.season.create({ data: { code: '24-25', startYear: 2024, endYear: 2025 } });
        }

        // Garantizar slug único
        let finalSlug = req.body.slug;
        const existingProduct = await prisma.product.findUnique({ where: { slug: finalSlug } });
        if (existingProduct) {
            finalSlug = `${finalSlug}-${Date.now().toString(36)}`;
        }

        const newProduct = await service.createProduct({
            name: req.body.name,
            slug: finalSlug,
            description: req.body.description || '',
            brand: req.body.brand || null,
            jerseyStyle: req.body.type || 'HOME',
            authentic: false,
            clubId: req.body.clubId || undefined,
            seasonCode: '24-25',
            imageUrl: req.body.imageUrl || (req.body.images?.[0]) || undefined,
            images: req.body.images || undefined,
            variants: req.body.variants || ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'].map(size => ({
                sku: `${req.body.slug}-${size}-${Date.now()}`,
                size,
                audience: req.body.gender || 'HOMBRE',
                sleeve: 'SHORT',
                priceCents: Math.round((req.body.price || 0) * 100),
                compareAtPriceCents: req.body.compareAtPrice ? Math.round(req.body.compareAtPrice * 100) : null,
                costCents: 0,
                stock: 0,
                isDropshippable: true,
                allowsNameNumber: false,
                customizationPrice: 19900,
                weightGrams: 200,
            })),
        });

        // Vincular categoría y tags
        await prisma.product.update({
            where: { id: newProduct.id },
            data: {
                categoryId: validCategoryId,
                tags: req.body.tagIds?.length > 0
                    ? { create: req.body.tagIds.map((tagId: string) => ({ tagId })) }
                    : undefined,
            },
        });

        res.status(201).json(newProduct);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Slug duplicado' });
        }
        next(error);
    }
});

// Zod schema para validación de PUT (sincronizado con POST)
const UpdateProductSchema = z.object({
    name: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    price: z.number(),
    imageUrl: z.string().optional(),
    images: z.array(z.string()).optional(),
    brand: z.string().optional().nullable(),
    gender: z.string().optional(),
    authentic: z.boolean().optional(),      // Versión global del producto
    categoryId: z.string().optional(),
    compareAtPrice: z.number().optional().nullable(),
    clubId: z.string().optional().nullable(),
    tagIds: z.array(z.string()).optional(),
    globalAllowsNameNumber: z.boolean().optional(),
    variants: z.array(z.object({
        size: z.string(),
        color: z.string().optional().nullable(),
        audience: z.string().optional(),
        sleeve: z.string().optional().nullable(),          // SHORT | LONG
        isPlayerVersion: z.boolean().default(false),       // Fan | Player
        hasLeaguePatch: z.boolean().default(false),
        hasChampionsPatch: z.boolean().default(false),
        stock: z.number().default(0),
        priceCents: z.number(),
        compareAtPriceCents: z.number().optional().nullable(),
        isDropshippable: z.boolean().default(true),
        allowsNameNumber: z.boolean().default(true),
        customizationPrice: z.number().default(19900),
    })).optional(),
});

// PUT /products/:id — Actualizar
router.put('/products/:id', requireAuth, async (req, res, next) => {
    const { id } = req.params;
    try {
        const body = UpdateProductSchema.parse(req.body);

        await prisma.$transaction(async (tx) => {
            await tx.product.update({
                where: { id },
                data: {
                    name: body.name,
                    slug: body.slug,
                    description: body.description,
                    brand: body.brand,
                    authentic: body.authentic,
                    categoryId: body.categoryId,
                    clubId: body.clubId || null,
                },
            });

            // Tags
            if (body.tagIds) {
                await tx.productTag.deleteMany({ where: { productId: id } });
                if (body.tagIds.length > 0) {
                    await tx.productTag.createMany({
                        data: body.tagIds.map(tagId => ({ productId: id, tagId })),
                    });
                }
            }

            // Variantes
            if (body.variants && body.variants.length > 0) {
                await tx.productVariant.deleteMany({ where: { productId: id } });
                await tx.productVariant.createMany({
                    data: body.variants.map(v => {
                        const sleeveTag = v.sleeve === 'LONG' ? 'ML' : 'MC';
                        const versionTag = v.isPlayerVersion ? 'PLY' : 'FAN';
                        const patchTag = v.hasLeaguePatch ? 'LP' : v.hasChampionsPatch ? 'CP' : 'NP';
                        return {
                            productId: id,
                            sku: `${body.slug}-${v.size}-${versionTag}-${sleeveTag}-${patchTag}`.toUpperCase(),
                            size: v.size,
                            color: v.color || null,
                            audience: (v.audience || body.gender || 'HOMBRE') as any,
                            sleeve: (v.sleeve || 'SHORT') as any,
                            isPlayerVersion: v.isPlayerVersion,
                            hasLeaguePatch: v.hasLeaguePatch,
                            hasChampionsPatch: v.hasChampionsPatch,
                            stock: v.stock,
                            priceCents: v.priceCents,
                            compareAtPriceCents: v.compareAtPriceCents || null,
                            isDropshippable: v.isDropshippable,
                            allowsNameNumber: body.globalAllowsNameNumber !== undefined
                                ? body.globalAllowsNameNumber
                                : v.allowsNameNumber,
                            customizationPrice: v.customizationPrice,
                        };
                    }),
                });
            } else {
                // Sin variantes nuevas → actualizar solo precio/audience en la primera
                const variants = await tx.productVariant.findMany({ where: { productId: id } });
                if (variants.length > 0) {
                    await tx.productVariant.update({
                        where: { id: variants[0].id },
                        data: {
                            priceCents: Math.round(body.price * 100),
                            compareAtPriceCents: body.compareAtPrice ? Math.round(body.compareAtPrice * 100) : null,
                            audience: body.gender as any,
                        },
                    });
                }
            }

            // Imágenes (multi-imagen o legacy imageUrl)
            if (body.images && body.images.length > 0) {
                await tx.productImage.deleteMany({ where: { productId: id } });
                await tx.productImage.createMany({
                    data: body.images.map((url: string, i: number) => ({
                        productId: id, url, sortOrder: i,
                    })),
                });
            } else if (body.imageUrl) {
                await tx.productImage.deleteMany({ where: { productId: id } });
                await tx.productImage.create({ data: { productId: id, url: body.imageUrl, sortOrder: 0 } });
            }
        });

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

// DELETE /products/:id — Eliminar
router.delete('/products/:id', requireAuth, async (req, res, next) => {
    try {
        await prisma.product.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

// POST /variants — Crear variante individual
router.post('/variants', requireAuth, controller.createVariant);

export default router;
