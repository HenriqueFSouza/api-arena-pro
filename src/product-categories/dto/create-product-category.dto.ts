import { z } from 'zod';

export const createProductCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export type CreateProductCategoryDto = z.infer<typeof createProductCategorySchema>; 