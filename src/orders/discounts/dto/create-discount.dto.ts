import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateDiscountDto {
    @ApiProperty({ description: 'Discount value' })
    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    value: number;

    @ApiPropertyOptional({ description: 'Reason for the discount' })
    @IsString()
    @IsOptional()
    reason?: string;
} 