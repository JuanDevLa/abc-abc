import { z } from 'zod';

export const CreateReviewSchema = z.object({
    productId: z.string().uuid('productId inválido'),
    name: z.string().min(1, 'Nombre requerido').max(100, 'Nombre máx 100 caracteres'),
    rating: z.coerce.number().int('Rating debe ser entero').min(1, 'Rating mínimo 1').max(5, 'Rating máximo 5'),
    comment: z.string().max(1000, 'Comentario máx 1000 caracteres').optional().default(''),
    image: z.string().url('URL de imagen inválida').optional().nullable(),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
