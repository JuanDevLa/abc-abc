import { z } from 'zod';

/* ─── Item dentro de la orden ─── */
const OrderItemSchema = z.object({
    // Opción A: variantId directo (tallas con variante existente)
    variantId: z.string().uuid('variantId inválido').optional().nullable(),

    // Opción B: productId + size (self-healing — el backend resolverá/creará la variante)
    productId: z.string().uuid('productId inválido').optional().nullable(),
    size: z.string().max(10).optional().nullable(),

    quantity: z.coerce.number().int().min(1, 'Cantidad mínima es 1'),

    // Personalización (opcional)
    isPersonalized: z.boolean().default(false),
    customName: z.string().max(30, 'Nombre máx 30 caracteres').optional().nullable(),
    customNumber: z.string().max(3, 'Número máx 3 dígitos').optional().nullable(),
}).refine(
    (data) => data.variantId || (data.productId && data.size),
    { message: 'Debe enviar variantId o (productId + size)', path: ['variantId'] }
);

/* ─── Crear orden ─── */
export const CreateOrderSchema = z.object({
    // Contacto
    email: z.string().email('Email inválido'),
    firstName: z.string().min(1, 'Nombre requerido').max(80),
    lastName: z.string().min(1, 'Apellido requerido').max(80),
    phone: z.string().min(10, 'Teléfono mínimo 10 dígitos').max(15),

    // Dirección
    address: z.string().min(5, 'Dirección requerida').max(200),
    city: z.string().min(1, 'Ciudad requerida').max(100),
    state: z.string().min(1, 'Estado requerido').max(100),
    zipCode: z.string().min(4, 'CP mínimo 4 dígitos').max(6),
    country: z.string().default('México'),
    reference: z.string().max(120, 'Referencia máx 120 caracteres').optional().nullable(),

    // Envío
    shippingMethod: z.string().min(1, 'Método de envío requerido'),

    // Items
    items: z
        .array(OrderItemSchema)
        .min(1, 'Debe tener al menos 1 producto'),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

/* ─── Actualizar status (admin) ─── */
export const UpdateOrderStatusSchema = z.object({
    status: z.enum([
        'PENDING_PAYMENT',
        'PAID',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
    ]),
    trackingNumber: z.string().max(100).optional().nullable(),
});
