import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { Profile } from '@prisma/client';
import { OrdersService } from './orders.service';
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe';
import {
  CreateOrderDto,
  createOrderSchema,
  OrderItemDto,
  orderItemSchema,
} from './dto/create-order.dto';
import { z } from 'zod';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  async create(
    @CurrentUser() user: Profile,
    @Body(new ZodValidationPipe(createOrderSchema))
    data: CreateOrderDto,
  ) {
    return this.ordersService.create(user.id, data);
  }

  @Get()
  async findAll(@CurrentUser() user: Profile) {
    return this.ordersService.findAll(user.id);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: Profile, @Param('id') id: string) {
    return this.ordersService.findOne(id, user.id);
  }

  @Put(':id/status')
  async updateStatus(
    @CurrentUser() user: Profile,
    @Param('id') id: string,
    @Body('status', new ZodValidationPipe(z.enum(['OPEN', 'CLOSED', 'ARCHIVED'])))
    status: 'OPEN' | 'CLOSED' | 'ARCHIVED',
  ) {
    return this.ordersService.updateStatus(id, user.id, status);
  }

  @Post(':id/items')
  async addItems(
    @CurrentUser() user: Profile,
    @Param('id') id: string,
    @Body('items', new ZodValidationPipe(z.array(orderItemSchema)))
    items: OrderItemDto[],
  ) {
    return this.ordersService.addItems(id, user.id, items);
  }
} 