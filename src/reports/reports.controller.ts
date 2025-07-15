import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Profile } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportPeriod, ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('sales')
    @ApiOperation({ summary: 'Get sales report with analytics data' })
    @ApiResponse({
        status: 200,
        description: 'Sales report data including charts, payment methods, and product analytics'
    })
    async getSalesReport(
        @CurrentUser() user: Profile,
        @Query('period') period: ReportPeriod = '3months',
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.reportsService.getSalesReport(user.id, period, startDate, endDate);
    }
} 