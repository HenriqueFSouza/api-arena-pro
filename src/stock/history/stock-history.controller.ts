import {
    Controller,
    Get,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { StockHistoryService } from './stock-history.service';

@ApiTags('stock-history')
@Controller('stock-history')
@UseGuards(JwtAuthGuard)
export class StockHistoryController {
    constructor(private readonly stockHistoryService: StockHistoryService) { }

    @Get(':stockId')
    @ApiOperation({ summary: 'Get stock history by stock ID' })
    @ApiResponse({ status: 200, description: 'Stock history retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Stock not found' })
    async getStockHistory(
        @Param('stockId') stockId: string,
    ) {
        return this.stockHistoryService.findByStockId(stockId);
    }

    @Get(':stockId/movements')
    @ApiOperation({ summary: 'Get stock movements with date filter' })
    @ApiResponse({ status: 200, description: 'Stock movements retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Stock not found' })
    async getStockMovements(
        @Param('stockId') stockId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.stockHistoryService.getStockMovements(
            stockId,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
    }

    // @Get(':stockId/summary')
    // @ApiOperation({ summary: 'Get stock movements summary' })
    // @ApiResponse({ status: 200, description: 'Stock movements summary retrieved successfully' })
    // @ApiResponse({ status: 404, description: 'Stock not found' })
    // async getStockMovementsSummary(
    //     @Param('stockId') stockId: string,
    //     @Query('startDate') startDate?: string,
    //     @Query('endDate') endDate?: string,
    // ) {
    //     return this.stockHistoryService.getStockMovementsSummary(
    //         stockId,
    //         startDate ? new Date(startDate) : undefined,
    //         endDate ? new Date(endDate) : undefined,
    //     );
    // }
} 