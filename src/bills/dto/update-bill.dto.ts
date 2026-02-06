import { ApiPropertyOptional } from '@nestjs/swagger';
import { BillRecurrence, BillStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateBillDto {
    @ApiPropertyOptional({
        description: 'Name of the bill',
        example: 'Electricity Bill',
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({
        description: 'Amount of the bill',
        example: 150.00,
    })
    @IsNumber()
    @Min(1.01)
    @IsOptional()
    amount?: number;

    @ApiPropertyOptional({
        description: 'Due date of the bill',
        example: '2026-02-15',
    })
    @IsDateString()
    @IsOptional()
    dueDate?: string;

    @ApiPropertyOptional({
        description: 'Optional notes about the bill',
    })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiPropertyOptional({
        description: 'Status of the bill',
        enum: BillStatus,
    })
    @IsEnum(BillStatus)
    @IsOptional()
    status?: BillStatus;

    @ApiPropertyOptional({
        description: 'Recurrence type for the bill',
        enum: BillRecurrence,
    })
    @IsEnum(BillRecurrence)
    @IsOptional()
    recurrence?: BillRecurrence;

    @ApiPropertyOptional({
        description: 'ID of the expense category',
    })
    @IsString()
    @IsOptional()
    expenseId?: string;
}
