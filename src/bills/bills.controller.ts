import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BillStatus, Profile } from '@prisma/client';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';

@ApiTags('bills')
@Controller('bills')
@UseGuards(JwtAuthGuard)
export class BillsController {
    constructor(private readonly billsService: BillsService) {}

    @Get()
    @ApiOperation({ summary: 'Get all bills with optional filters' })
    @ApiQuery({ name: 'status', enum: BillStatus, required: false })
    @ApiQuery({ name: 'startDate', required: false, description: 'Filter bills from this date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'endDate', required: false, description: 'Filter bills until this date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'expenseId', required: false, description: 'Filter by expense category' })
    @ApiResponse({
        status: 200,
        description: 'Returns all bills matching the filters',
    })
    async findAll(
        @CurrentUser() user: Profile,
        @Query('status') status?: BillStatus,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('expenseId') expenseId?: string,
    ) {
        return this.billsService.findAll(user.id, { status, startDate, endDate, expenseId });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a single bill by ID' })
    @ApiResponse({
        status: 200,
        description: 'Returns the bill details',
    })
    @ApiResponse({
        status: 404,
        description: 'Bill not found',
    })
    async findOne(@CurrentUser() user: Profile, @Param('id') id: string) {
        return this.billsService.findOne(id, user.id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new bill' })
    @ApiResponse({
        status: 201,
        description: 'Bill created successfully',
    })
    async create(@CurrentUser() user: Profile, @Body() createBillDto: CreateBillDto) {
        return this.billsService.create(user.id, createBillDto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a bill' })
    @ApiResponse({
        status: 200,
        description: 'Bill updated successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Bill not found',
    })
    async update(
        @CurrentUser() user: Profile,
        @Param('id') id: string,
        @Body() updateBillDto: UpdateBillDto,
    ) {
        return this.billsService.update(id, user.id, updateBillDto);
    }

    @Post(':id/pay')
    @ApiOperation({ summary: 'Mark a bill as paid' })
    @ApiResponse({
        status: 200,
        description: 'Bill marked as paid. If recurring, next occurrence is created.',
    })
    @ApiResponse({
        status: 400,
        description: 'Only pending bills can be paid',
    })
    @ApiResponse({
        status: 404,
        description: 'Bill not found',
    })
    async pay(@CurrentUser() user: Profile, @Param('id') id: string) {
        return this.billsService.pay(id, user.id);
    }

    @Post(':id/cancel')
    @ApiOperation({ summary: 'Cancel a bill' })
    @ApiResponse({
        status: 200,
        description: 'Bill cancelled successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Only pending bills can be cancelled',
    })
    @ApiResponse({
        status: 404,
        description: 'Bill not found',
    })
    async cancel(@CurrentUser() user: Profile, @Param('id') id: string) {
        return this.billsService.cancel(id, user.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a bill' })
    @ApiResponse({
        status: 200,
        description: 'Bill deleted successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Bill not found',
    })
    async delete(@CurrentUser() user: Profile, @Param('id') id: string) {
        return this.billsService.delete(id, user.id);
    }
}
