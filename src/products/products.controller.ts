import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { Profile } from '@prisma/client';
import { ProductsService } from './products.service';
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe';
import {
  CreateProductDto,
  createProductSchema,
} from './dto/create-product.dto';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post()
  async create(
    @CurrentUser() user: Profile,
    @Body(new ZodValidationPipe(createProductSchema))
    data: CreateProductDto,
  ) {
    return this.productsService.create(user.id, data);
  }

  @Get()
  async findAll(@CurrentUser() user: Profile) {
    return this.productsService.findAll(user.id);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: Profile, @Param('id') id: string) {
    return this.productsService.findOne(id, user.id);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: Profile,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createProductSchema))
    data: CreateProductDto,
  ) {
    return this.productsService.update(id, user.id, data);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: Profile, @Param('id') id: string) {
    return this.productsService.delete(id, user.id);
  }
} 