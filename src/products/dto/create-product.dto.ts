import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be greater than or equal to 0'),
  quantity: z.number().int().min(0, 'Quantity must be greater than or equal to 0').optional(),
  categoryId: z.string().uuid('Invalid category ID'),
});

export type CreateProductDto = z.infer<typeof createProductSchema>; 