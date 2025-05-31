import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

import { ApiProperty } from "@nestjs/swagger";

export enum StockHistoryType {
    INCOMING = 'INCOMING',
    OUTGOING = 'OUTGOING',
    ADJUSTMENT = 'ADJUSTMENT',
    INVENTORY = 'INVENTORY',
}

export class CreateStockHistoryDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    stockId: string;

    @ApiProperty()
    @IsEnum(StockHistoryType)
    type: StockHistoryType;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    initialQuantity?: number;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    finalQuantity: number;

    @ApiProperty()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    totalPrice?: number;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    unitPrice?: number;
}

