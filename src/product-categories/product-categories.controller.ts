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
import { ProductCategoriesService } from './product-categories.service';
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe';
import {
  CreateProductCategoryDto,
  createProductCategorySchema,
} from './dto/create-product-category.dto';

@Controller('product-categories')
@UseGuards(JwtAuthGuard)
export class ProductCategoriesController {
  constructor(private productCategoriesService: ProductCategoriesService) {}

  @Post()
  async create(
    @CurrentUser() user: Profile,
    @Body(new ZodValidationPipe(createProductCategorySchema))
    data: CreateProductCategoryDto,
  ) {
    return this.productCategoriesService.create(user.id, data);
  }

  @Get()
  async findAll(@CurrentUser() user: Profile) {
    return this.productCategoriesService.findAll(user.id);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: Profile, @Param('id') id: string) {
    return this.productCategoriesService.findOne(id, user.id);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: Profile,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createProductCategorySchema))
    data: CreateProductCategoryDto,
  ) {
    return this.productCategoriesService.update(id, user.id, data);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: Profile, @Param('id') id: string) {
    return this.productCategoriesService.delete(id, user.id);
  }
} 