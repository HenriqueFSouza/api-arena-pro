import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum UnitMeasure {
    UNIT = 'UNIT',
    KILOGRAM = 'KILOGRAM',
    LITER = 'LITER',
}

export class CreateStockDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    quantity: number;

    @ApiProperty({ enum: UnitMeasure })
    @IsEnum(UnitMeasure)
    unitMeasure: UnitMeasure;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    unitPrice: number;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    @IsOptional()
    totalPrice?: number;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    @IsOptional()
    minStock?: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    expenseId: string;
}

export class UpdateStockDto {
    @ApiProperty()
    @IsString()
    @IsOptional()
    name: string;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    @IsOptional()
    quantity: number;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    @IsOptional()
    unitPrice: number;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    @IsOptional()
    totalPrice: number;

    @ApiProperty()
    @IsString()
    @IsOptional()
    expenseId: string;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    @IsOptional()
    minStock: number;
}

export class UpdateByInventoryDto {
    @ApiProperty()
    @IsArray()
    @IsNotEmpty()
    items: { itemId: string, quantity: number }[];
}