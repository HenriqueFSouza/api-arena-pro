import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    UseGuards
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Profile } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateStockDto, UpdateByInventoryDto, UpdateStockDto } from './dto/create-stock.dto';
import { StockService } from './stock.service';

@ApiTags('stock')
@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
    constructor(private readonly stockService: StockService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new stock item' })
    @ApiResponse({ status: 201, description: 'Stock item created successfully' })
    create(@CurrentUser() user: Profile, @Body() createStockDto: CreateStockDto) {
        return this.stockService.create(createStockDto, user.id);
    }

    @Get()
    @ApiOperation({ summary: 'Get all stock items' })
    @ApiResponse({ status: 200, description: 'Stock items retrieved successfully' })
    findAll(@CurrentUser() user: Profile) {
        return this.stockService.findAll(user.id);
    }

    @Put('inventory')
    @ApiOperation({ summary: 'Update stock items by inventory' })
    @ApiResponse({ status: 200, description: 'Stock items updated successfully' })
    @ApiResponse({ status: 404, description: 'Stock item not found' })
    updateByInventory(@CurrentUser() user: Profile, @Body() updateByInventoryDto: UpdateByInventoryDto) {
        return this.stockService.updateByInventory(updateByInventoryDto, user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a stock item by ID' })
    @ApiResponse({ status: 200, description: 'Stock item retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Stock item not found' })
    findOne(@CurrentUser() user: Profile, @Param('id') id: string) {
        return this.stockService.findOne(id, user.id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a stock item' })
    @ApiResponse({ status: 200, description: 'Stock item updated successfully' })
    @ApiResponse({ status: 404, description: 'Stock item not found' })
    update(
        @CurrentUser() user: Profile,
        @Param('id') id: string,
        @Body() updateStockDto: UpdateStockDto,
    ) {
        return this.stockService.update(id, updateStockDto, user.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a stock item' })
    @ApiResponse({ status: 200, description: 'Stock item deleted successfully' })
    @ApiResponse({ status: 404, description: 'Stock item not found' })
    remove(@CurrentUser() user: Profile, @Param('id') id: string) {
        return this.stockService.remove(id, user.id);
    }
} 