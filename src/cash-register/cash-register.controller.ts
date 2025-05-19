import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Profile } from '@prisma/client';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CashRegisterService, Sale } from './cash-register.service';
import { CloseCashRegisterDto } from './dto/close-cash-register.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { OpenCashRegisterDto } from './dto/open-cash-register.dto';

@Controller('cash-register')
@UseGuards(JwtAuthGuard)
export class CashRegisterController {
    constructor(private readonly cashRegisterService: CashRegisterService) { }

    @Post('open')
    @ApiOperation({ summary: 'Open a new cash register' })
    @ApiResponse({ status: 201, description: 'Cash register opened successfully' })
    @ApiResponse({ status: 400, description: 'Invalid request body' })
    async openCashRegister(@CurrentUser() user: Profile, @Body() dto: OpenCashRegisterDto) {
        return this.cashRegisterService.openCashRegister(dto, user.id);
    }

    @Get('current')
    @ApiOperation({ summary: 'Get the current cash register' })
    @ApiResponse({ status: 200, description: 'Current cash register retrieved successfully' })
    @ApiResponse({ status: 404, description: 'No open cash register found' })
    async getCurrentCashRegister(@CurrentUser() user: Profile) {
        return this.cashRegisterService.getCurrentCashRegister({ ownerId: user.id });
    }

    @Post('transactions')
    @ApiOperation({ summary: 'Create a new transaction for the current cash register' })
    @ApiResponse({ status: 201, description: 'Transaction created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid request body' })
    async createTransaction(@CurrentUser() user: Profile, @Body() dto: CreateTransactionDto) {
        return this.cashRegisterService.createTransaction(dto, user.id);
    }

    @Get('sales/:id')
    @ApiOperation({ summary: 'Get the sales of a cash register' })
    @ApiResponse({ status: 200, description: 'Sales retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Cash register not found' })
    async getCashRegisterSales(@Param('id') id: string): Promise<Sale[]> {
        return this.cashRegisterService.getCashRegisterSales(id);
    }

    @Post('register-payments/:id')
    @ApiOperation({ summary: 'Register payments for the current cash register' })
    @ApiResponse({ status: 200, description: 'Payments registered successfully' })
    @ApiResponse({ status: 400, description: 'Invalid request body' })
    @HttpCode(HttpStatus.OK)
    async registerPayments(@Body() dto: CloseCashRegisterDto, @Param('id') id: string) {
        return this.cashRegisterService.registerPayments(dto, id);
    }

    @Post('close/:id')
    @ApiOperation({ summary: 'Close the current cash register' })
    @ApiResponse({ status: 200, description: 'Cash register closed successfully' })
    @ApiResponse({ status: 400, description: 'Invalid request body' })
    @HttpCode(HttpStatus.OK)
    async closeCashRegister(@Param('id') id: string) {
        return this.cashRegisterService.closeCashRegister(id);
    }

    @Get(':id/report')
    @ApiOperation({ summary: 'Get the report of a cash register' })
    @ApiResponse({ status: 200, description: 'Cash register report retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Cash register not found' })
    async getCashRegisterReport(@Param('id') id: string) {
        return this.cashRegisterService.getCashRegisterReport(id);
    }
} 