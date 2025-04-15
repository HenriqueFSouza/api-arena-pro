import { z } from 'zod';

export const orderItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  note: z.string().optional(),
  orderClientId: z.string().uuid('Invalid order client ID').optional(),
});

const clientInfoSchema = z.object({
  phone: z.string(),
  name: z.string().optional(),
});

export const createOrderSchema = z.object({
  note: z.string().optional(),
  clientInfo: clientInfoSchema.optional(),
  items: z.array(orderItemSchema).optional(),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type OrderItemDto = z.infer<typeof orderItemSchema>; 