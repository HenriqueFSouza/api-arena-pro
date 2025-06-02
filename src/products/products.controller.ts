import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Profile } from '@prisma/client';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  CreateProductDto,
} from './dto/create-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  async create(
    @CurrentUser() user: Profile,
    @Body()
    data: CreateProductDto,
  ) {
    return this.productsService.create(user.id, data);
  }

  @Get()
  async findAll(
    @CurrentUser() user: Profile,
    @Query('categoryId') categoryId: string,
    @Query('search') search: string,
  ) {
    return this.productsService.findAll(user.id, categoryId, search);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: Profile, @Param('id') id: string) {
    return this.productsService.findOne(id, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  async update(
    @CurrentUser() user: Profile,
    @Param('id') id: string,
    @Body()
    data: CreateProductDto,
  ) {
    return this.productsService.update(id, user.id, data);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: Profile, @Param('id') id: string) {
    return this.productsService.delete(id, user.id);
  }
} 