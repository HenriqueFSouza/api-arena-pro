import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateExpenseDto {
    @ApiProperty({
        description: 'Name of the expense',
        example: 'Internet',
    })
    @IsString()
    @IsNotEmpty()
    name: string;
} 