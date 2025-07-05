import { PaymentMethod } from "@prisma/client";
import { IsArray, IsNotEmpty } from "class-validator";

export type UpdateTransactionPayments = {
    paymentId: string;
    paymentMethod: PaymentMethod;
}

export class UpdateTransactionDto {
    @IsArray()
    @IsNotEmpty()
    payments: UpdateTransactionPayments[];
}