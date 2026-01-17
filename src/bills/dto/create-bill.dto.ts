import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillRecurrence } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBillDto {
    @ApiProperty({
        description: 'Name of the bill',
        example: 'Electricity Bill',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Amount of the bill',
        example: 150.00,
    })
    @IsNumber()
    @Min(1.01)
    amount: number;

    @ApiProperty({
        description: 'Due date of the bill',
        example: '2026-02-15',
    })
    @IsDateString()
    dueDate: string;

    @ApiPropertyOptional({
        description: 'Optional notes about the bill',
        example: 'Monthly electricity payment',
    })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiPropertyOptional({
        description: 'Recurrence type for the bill',
        enum: BillRecurrence,
        default: 'NONE',
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
