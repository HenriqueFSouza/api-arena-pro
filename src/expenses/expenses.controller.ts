import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Profile } from '@prisma/client';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpensesService } from './expenses.service';

@ApiTags('expenses')
@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
    constructor(private readonly expensesService: ExpensesService) { }

    @Get()
    @ApiOperation({ summary: 'Get all expenses (system default and user expenses)' })
    @ApiResponse({
        status: 200,
        description: 'Returns all expenses including system defaults and user expenses',
    })
    async findAll(@CurrentUser() user: Profile, @Query('query') query: string) {
        return this.expensesService.findAll(user.id, query);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new expense' })
    @ApiResponse({
        status: 201,
        description: 'Creates a new expense for the authenticated user',
    })
    async create(@CurrentUser() user: Profile, @Body() createExpenseDto: CreateExpenseDto) {
        return this.expensesService.create({
            ...createExpenseDto,
            ownerId: user.id,
        });
    }
}
