import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';

@ApiTags('Discounts')
@Controller('discounts')
export class DiscountsController {
    constructor(private readonly discountsService: DiscountsService) { }

    @Post('/:orderId')
    @ApiOperation({ summary: 'Create a new discount' })
    @ApiResponse({ status: 201, description: 'Discount created successfully' })
    create(@Body() createDiscountDto: CreateDiscountDto, @Param('orderId') orderId: string) {
        return this.discountsService.create(createDiscountDto, orderId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remove a discount' })
    @ApiResponse({ status: 200, description: 'Discount removed successfully' })
    remove(@Param('id') id: string) {
        return this.discountsService.remove(id);
    }

    @Get('order/:orderId')
    @ApiOperation({ summary: 'Get all discounts for an order' })
    @ApiResponse({ status: 200, description: 'Returns all discounts for the specified order' })
    findByOrderId(@Param('orderId') orderId: string) {
        return this.discountsService.findByOrderId(orderId);
    }
} 