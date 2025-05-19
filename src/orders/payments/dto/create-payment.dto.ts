import { z } from 'zod';

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  PIX = 'PIX',
}

export const createPaymentSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  method: z.enum([PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.PIX]),
  note: z.string().optional(),
  orderClientId: z.string().uuid('Invalid order client ID').optional(),
});

export type CreatePaymentDto = z.infer<typeof createPaymentSchema>; 