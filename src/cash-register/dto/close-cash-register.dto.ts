import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, Min, ValidateNested } from 'class-validator';
import { PaymentMethod } from 'src/orders/payments/dto/create-payment.dto';

export class RegisteredPayment {
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @IsNumber()
    @Min(0)
    amount: number;
}

export class CloseCashRegisterDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RegisteredPayment)
    registeredPayments: RegisteredPayment[];
} 