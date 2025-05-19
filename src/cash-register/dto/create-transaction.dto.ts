import { PaymentMethod } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum TransactionOriginType {
    PAYMENT = 'PAYMENT',
    EXPENSE = 'EXPENSE',
    INCREMENT = 'INCREMENT',
}

export class CreateTransactionDto {
    @IsString()
    @IsOptional()
    originId?: string;

    @IsEnum(TransactionOriginType)
    originType: TransactionOriginType;

    @IsNumber()
    @Min(0)
    @IsOptional()
    amount?: number;

    @IsString()
    @IsOptional()
    reason?: string;

    @IsString()
    @IsOptional()
    @IsEnum(PaymentMethod)
    paymentMethod?: PaymentMethod;
}

