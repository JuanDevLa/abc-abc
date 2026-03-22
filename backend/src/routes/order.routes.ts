// src/routes/order.routes.ts
import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { verifyToken } from '../lib/auth.js';
import { CreateOrderSchema, UpdateOrderStatusSchema } from '../validators/order.validator.js';
import { SHIPPING } from '../config/shipping.js';

const router = Router();

const ORDER_EXPIRY_HOURS = 12;

/* ─── Rate limiter para creación de órdenes (10 / 10 min por IP) ─── */
const createOrderLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: { error: 'Demasiados intentos. Intenta de nuevo en 10 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/* ─── Generar número de orden único ─── */
function generateOrderNumber(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `JR-${date}-${rand}`;
}

/* ─── POST /orders — Crear orden (público) ─── */
router.post('/orders', createOrderLimiter, async (req: Request, res: Response) => {
    // 1. Validar input
    const parsed = CreateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        const messages = Object.entries(fieldErrors)
            .map(([field, errs]) => `${field}: ${(errs as string[]).join(', ')}`)
            .join('; ');
        return res.status(400).json({
            error: messages || 'Datos inválidos',
            details: fieldErrors,
        });
    }

    const data = parsed.data;

    // Extraer userId si viene un token válido (compra loggeada). Guest → null.
    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        const payload = verifyToken(authHeader.slice(7));
        if (payload) userId = payload.sub;
    }

    try {
        // 2. Resolver variantes — Self-healing: buscar existente o crear on-the-fly
        const resolvedVariantIds: string[] = [];

        for (const item of data.items) {
            let resolvedId = item.variantId;

            if (resolvedId) {
                // Opción A: variantId directo — verificar que existe
                const exists = await prisma.productVariant.findUnique({ where: { id: resolvedId } });
                if (!exists) {
                    return res.status(400).json({ error: `Variante ${resolvedId} no encontrada` });
                }
            } else if (item.productId && item.size) {
                // Opción B: productId + size — buscar o crear
                const existing = await prisma.productVariant.findFirst({
                    where: { productId: item.productId, size: item.size },
                });

                if (existing) {
                    resolvedId = existing.id;
                } else {
                    // 🔒 SEGURIDAD: Tomar precio de variantes existentes del mismo producto
                    const referenceVariant = await prisma.productVariant.findFirst({
                        where: { productId: item.productId },
                        orderBy: { createdAt: 'asc' },
                    });

                    if (!referenceVariant) {
                        return res.status(400).json({ error: `Producto ${item.productId} no tiene variantes de referencia` });
                    }

                    // Verificar que el producto existe
                    const product = await prisma.product.findUnique({
                        where: { id: item.productId },
                        select: { slug: true },
                    });

                    if (!product) {
                        return res.status(400).json({ error: `Producto ${item.productId} no encontrado` });
                    }

                    // Crear variante de dropshipping con precio SEGURO del backend
                    const newVariant = await prisma.productVariant.create({
                        data: {
                            productId: item.productId,
                            sku: `${product.slug}-${item.size}-DROP`.toUpperCase(),
                            size: item.size,
                            color: referenceVariant.color,
                            audience: referenceVariant.audience,
                            sleeve: referenceVariant.sleeve,
                            priceCents: referenceVariant.priceCents,                     // 🔒 Precio del backend
                            compareAtPriceCents: referenceVariant.compareAtPriceCents,     // 🔒 Precio del backend
                            costCents: referenceVariant.costCents,
                            stock: 0,
                            isDropshippable: true,
                            allowsNameNumber: referenceVariant.allowsNameNumber,
                            customizationPrice: referenceVariant.customizationPrice,
                            weightGrams: referenceVariant.weightGrams,
                        },
                    });

                    resolvedId = newVariant.id;
                }
            } else {
                return res.status(400).json({ error: 'Item inválido: falta variantId o productId+size' });
            }

            resolvedVariantIds.push(resolvedId!);
        }

        // 3. Consultar precios REALES de cada variante resuelta
        const variants = await prisma.productVariant.findMany({
            where: { id: { in: resolvedVariantIds } },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        images: { take: 1, orderBy: { sortOrder: 'asc' } },
                    },
                },
            },
        });

        // 4. Verificar que todas las variantes resueltas existen (sanity check)
        const variantMap = new Map(variants.map(v => [v.id, v]));
        for (let i = 0; i < data.items.length; i++) {
            const vid = resolvedVariantIds[i];
            if (!variantMap.has(vid)) {
                return res.status(400).json({ error: `Variante ${vid} no encontrada tras resolución` });
            }
        }

        // 5. Calcular subtotal con precios REALES del backend (pre-transacción)
        let subtotalCents = 0;

        const preOrderItems = data.items.map((item, i) => {
            const variant = variantMap.get(resolvedVariantIds[i])!;
            const unitPrice = variant.priceCents;

            // Agregar costo de personalización si aplica
            let itemTotal = unitPrice * item.quantity;
            if (item.isPersonalized && variant.allowsNameNumber) {
                itemTotal += variant.customizationPrice * item.quantity;
            }

            subtotalCents += itemTotal;

            return {
                productId: variant.product.id,
                variantId: variant.id,
                productName: variant.product.name,
                productSlug: variant.product.slug,
                productImageUrl: variant.product.images[0]?.url || null,
                variantSize: variant.size,
                variantColor: variant.color,
                quantity: item.quantity,
                unitPriceCents: unitPrice,
                totalCents: itemTotal,
                // ⚠️ Se resolverá dentro de la transacción según stock real
                isDropshippable: variant.isDropshippable,
                isPersonalized: item.isPersonalized,
                customName: item.isPersonalized ? item.customName : null,
                customNumber: item.isPersonalized ? item.customNumber : null,
            };
        });

        // 6. Calcular envío (pre-cálculo, se recalcula dentro de la transacción)
        const shippingMethod = data.shippingMethod;
        const orderNumber = generateOrderNumber();
        const expiresAt = new Date(Date.now() + ORDER_EXPIRY_HOURS * 60 * 60 * 1000);

        // 7. 🔒 TRANSACCIÓN ATÓMICA: Verificar stock + descontar + crear orden
        //    Todo ocurre en una sola transacción para prevenir race conditions.
        const order = await prisma.$transaction(async (tx) => {

            // 7a. Re-leer stock DENTRO de la transacción (datos frescos, no stale)
            const freshVariants = await tx.productVariant.findMany({
                where: { id: { in: resolvedVariantIds } },
                select: { id: true, stock: true, isDropshippable: true },
            });
            const freshMap = new Map(freshVariants.map(v => [v.id, v]));

            // 7b. Decidir por cada ítem: Envío Rápido (local) o Dropshipping
            const finalOrderItems = preOrderItems.map((item, i) => {
                const vid = resolvedVariantIds[i];
                const fresh = freshMap.get(vid)!;
                const qty = data.items[i].quantity;

                // Si tiene stock local suficiente → Envío Rápido
                // Si no tiene stock o es dropshippable → Dropshipping (no falla)
                const canFulfillLocally = !fresh.isDropshippable && fresh.stock >= qty;

                return {
                    ...item,
                    isDropshippable: !canFulfillLocally, // true = dropship, false = local
                    _shouldDecrementStock: canFulfillLocally,
                    _variantId: vid,
                    _quantity: qty,
                };
            });

            // 7c. Descontar stock ATÓMICAMENTE solo para ítems con stock local
            for (const item of finalOrderItems) {
                if (item._shouldDecrementStock) {
                    try {
                        await tx.productVariant.update({
                            where: { id: item._variantId },
                            data: { stock: { decrement: item._quantity } },
                        });
                    } catch (err) {
                        // Si el decremento falla (race condition extrema), marcar como dropshipping
                        console.warn(`⚠️ Decremento falló para variante ${item._variantId}, fallback a dropshipping`);
                        item.isDropshippable = true;
                    }
                }
            }

            // 7d. Calcular envío REAL basado en decisiones finales de fulfillment
            const allDropshippable = finalOrderItems.every(item => item.isDropshippable);
            const isExpress = shippingMethod.toUpperCase().includes('EXPRESS');
            let shippingCents: number;

            if (allDropshippable) {
                shippingCents = 0; // Dropshipping siempre gratis
            } else if (isExpress) {
                shippingCents = SHIPPING.EXPRESS_CENTS;
            } else {
                shippingCents = subtotalCents >= SHIPPING.FREE_SHIPPING_MIN_CENTS ? 0 : SHIPPING.STANDARD_CENTS;
            }

            const totalCents = subtotalCents + shippingCents;

            // 7e. Crear la orden con los ítems ya resueltos
            // Limpiar campos internos (_shouldDecrementStock, etc.) antes de insertar
            const cleanItems = finalOrderItems.map(({ _shouldDecrementStock, _variantId, _quantity, ...rest }) => rest);

            const newOrder = await tx.order.create({
                data: {
                    orderNumber,
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    address: data.address,
                    city: data.city,
                    state: data.state,
                    zipCode: data.zipCode,
                    country: data.country,
                    reference: data.reference || null,
                    shippingMethod,
                    shippingCents,
                    subtotalCents,
                    totalCents,
                    currency: 'MXN',
                    expiresAt,
                    userId,
                    items: {
                        create: cleanItems,
                    },
                },
                include: {
                    items: true,
                },
            });

            return newOrder;
        });

        // TODO: Enviar email de notificación al admin (Resend/SendGrid en fase futura)

        res.status(201).json({
            orderNumber: order.orderNumber,
            status: order.status,
            totalCents: order.totalCents,
            shippingCents: order.shippingCents,
            expiresAt: order.expiresAt,
            itemCount: order.items.length,
        });
    } catch (error) {
        console.error('Error al crear orden:', error);
        res.status(500).json({ error: 'Error interno al procesar la orden' });
    }
});

/* ─── GET /orders/mine — Órdenes del usuario autenticado ─── */
// ⚠️ IMPORTANTE: Esta ruta DEBE ir ANTES de /orders/:orderNumber
// para que Express no interprete "mine" como un :orderNumber.
router.get('/orders/mine', requireAuth, async (req: Request, res: Response) => {
    try {
        // Buscar email del usuario para incluir órdenes hechas con ese email sin userId
        const me = await prisma.user.findUnique({
            where: { id: req.user!.sub },
            select: { email: true },
        });

        const orders = await prisma.order.findMany({
            where: {
                OR: [
                    { userId: req.user!.sub },
                    ...(me?.email ? [{ email: me.email }] : []),
                ],
                // No mostrar órdenes pendientes de pago — no son pedidos confirmados aún
                status: { not: 'PENDING_PAYMENT' },
            },
            include: {
                items: {
                    select: {
                        productName: true,
                        productImageUrl: true,
                        variantSize: true,
                        variantColor: true,
                        quantity: true,
                        unitPriceCents: true,
                        totalCents: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ items: orders });
    } catch {
        return res.status(500).json({ error: 'Error al obtener tus órdenes' });
    }
});

/* ─── GET /orders/:orderNumber — Ver orden por número (público) ─── */
// Sin ?email: devuelve únicamente campos no-sensibles (seguro para cualquier visitante).
// Con ?email=<correo>: si el email coincide con el de la orden, devuelve los datos completos
// (nombre, dirección, teléfono). Esto previene la enumeración de datos personales de clientes.
router.get('/orders/:orderNumber', async (req: Request, res: Response) => {
    const { orderNumber } = req.params;
    const emailQuery = (req.query.email as string | undefined)?.trim().toLowerCase();

    try {
        const order = await prisma.order.findUnique({
            where: { orderNumber },
            include: {
                items: {
                    select: {
                        productName: true,
                        productImageUrl: true,
                        variantSize: true,
                        variantColor: true,
                        quantity: true,
                        unitPriceCents: true,
                        totalCents: true,
                        isDropshippable: true,
                        isPersonalized: true,
                        customName: true,
                        customNumber: true,
                    },
                },
            },
        });

        if (!order) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        // Campos públicos — nunca exponen datos personales del cliente
        const publicFields = {
            orderNumber: order.orderNumber,
            status: order.status,
            shippingMethod: order.shippingMethod,
            shippingCents: order.shippingCents,
            subtotalCents: order.subtotalCents,
            totalCents: order.totalCents,
            currency: order.currency,
            createdAt: order.createdAt,
            items: order.items,
        };

        // Si se proporciona email y coincide (case-insensitive), incluir datos personales
        if (emailQuery && order.email.toLowerCase() === emailQuery) {
            return res.json({
                ...publicFields,
                email: order.email,
                firstName: order.firstName,
                lastName: order.lastName,
                phone: order.phone,
                address: order.address,
                city: order.city,
                state: order.state,
                zipCode: order.zipCode,
                country: order.country,
                reference: order.reference,
            });
        }

        return res.json(publicFields);
    } catch {
        return res.status(500).json({ error: 'Error al obtener la orden' });
    }
});



/* ─── GET /orders — Listar órdenes (admin) ─── */
router.get('/orders', requireAuth, async (req: Request, res: Response) => {
    const { status, page = '1' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSize = 20;

    const validStatuses = ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;
    const where = status && (validStatuses as readonly string[]).includes(status as string)
        ? { status: status as (typeof validStatuses)[number] }
        : {};

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            include: {
                items: {
                    include: {
                        product: { select: { fulfillmentType: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (pageNum - 1) * pageSize,
            take: pageSize,
        }),
        prisma.order.count({ where }),
    ]);

    res.json({
        items: orders,
        pagination: {
            total,
            page: pageNum,
            totalPages: Math.ceil(total / pageSize),
        },
    });
});

/* ─── PUT /orders/:id/status — Cambiar status (admin) ─── */
router.put('/orders/:id/status', requireAuth, async (req: Request, res: Response) => {
    const parsed = UpdateOrderStatusSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: 'Status inválido',
            details: parsed.error.flatten().fieldErrors,
        });
    }

    try {
        const updateData: Record<string, any> = { status: parsed.data.status };

        // Guardar número de rastreo si se proporciona
        if (parsed.data.trackingNumber !== undefined) {
            updateData.trackingNumber = parsed.data.trackingNumber;
        }

        const order = await prisma.order.update({
            where: { id: req.params.id },
            data: updateData,
            include: { items: true },
        });

        res.json(order);
    } catch {
        res.status(404).json({ error: 'Orden no encontrada' });
    }
});

/* ─── POST /orders/:orderNumber/stripe-session — Crear sesión Stripe Checkout ─── */
// El flujo es:
//   1. Frontend crea la orden → recibe orderNumber
//   2. Frontend llama este endpoint → recibe stripeUrl
//   3. Frontend redirige al usuario a stripeUrl (página de pago de Stripe)
//   4. Stripe, al completar el pago, llama al webhook → orden pasa a PAID
router.post('/orders/:orderNumber/stripe-session', async (req: Request, res: Response) => {
    const { orderNumber } = req.params;

    // Verificar configuración de Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!stripeSecretKey) {
        return res.status(503).json({ error: 'Pasarela de pago no configurada.' });
    }

    try {
        // Buscar la orden
        const order = await prisma.order.findUnique({
            where: { orderNumber },
            include: {
                items: {
                    include: {
                        product: { select: { fulfillmentType: true } },
                    },
                },
            },
        });

        if (!order) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        if (order.status !== 'PENDING_PAYMENT') {
            return res.status(400).json({ error: 'Esta orden ya fue pagada o cancelada.' });
        }

        // Importación dinámica de Stripe para no romper si la clave no está
        const { default: Stripe } = await import('stripe');
        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2026-02-25.clover' });

        // Construir line_items desde los items de la orden
        // IMPORTANTE: usamos totalCents/quantity como unit_amount para incluir
        // el costo de personalización (si aplica) en el precio unitario real.
        const lineItems: any[] = order.items.map((item) => ({
            price_data: {
                currency: 'mxn',
                product_data: {
                    name: item.productName + (item.isPersonalized ? ` (✨ ${item.customName} #${item.customNumber})` : ''),
                    images: item.productImageUrl ? [item.productImageUrl] : [],
                },
                // ✅ FIX: totalCents ya incluye personalización × cantidad
                unit_amount: Math.round(item.totalCents / item.quantity),
            },
            quantity: item.quantity,
        }));

        // Agregar envío como line_item adicional si no es gratis
        if (order.shippingCents > 0) {
            lineItems.push({
                price_data: {
                    currency: 'mxn',
                    product_data: {
                        name: order.shippingMethod === 'EXPRESS' ? 'Envío Express (DHL)' : 'Envío Estándar',
                    },
                    unit_amount: order.shippingCents,
                },
                quantity: 1,
            });
        }

        // Crear la sesión de Checkout en Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: lineItems,
            // ✅ Los metadatos permiten al webhook saber qué orden actualizar
            metadata: {
                orderNumber: order.orderNumber,
                orderId:     order.id,
            },
            customer_email: order.email,
            success_url: `${frontendUrl}/confirmation/${order.orderNumber}?paid=1`,
            cancel_url:  `${frontendUrl}/checkout?cancelled=1`,
            expires_at:  Math.floor(Date.now() / 1000) + (30 * 60), // Expira en 30 min
        });

        return res.json({ stripeUrl: session.url });
    } catch (error) {
        console.error('Error creando sesión de Stripe:', error);
        return res.status(500).json({ error: 'Error al conectar con la pasarela de pago.' });
    }
});

export default router;

