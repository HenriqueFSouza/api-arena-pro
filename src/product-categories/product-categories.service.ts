import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';

@Injectable()
export class ProductCategoriesService {
  constructor(private prisma: PrismaService) { }

  async create(ownerId: string, data: CreateProductCategoryDto) {
    const categoryWithSameName = await this.prisma.productCategory.findFirst({
      where: {
        name: data.name,
        owner: {
          id: ownerId
        },
      },
    });

    if (categoryWithSameName) {
      throw new ConflictException('Esta categoria já existe');
    }

    const category = await this.prisma.productCategory.create({
      data: {
        name: data.name,
        description: data.description,
        owner: {
          connect: {
            id: ownerId
          }
        }
      },
    });

    return category;
  }

  async findAll(ownerId: string) {
    const categories = await this.prisma.productCategory.findMany({
      where: {
        ownerId,
      },
      include: {
        products: {
          where: {
            deletedAt: null
          }
        },
      },
    });

    return categories;
  }

  async findOne(id: string, ownerId: string) {
    const category = await this.prisma.productCategory.findFirst({
      where: {
        id,
        ownerId,
      },
      include: {
        products: {
          where: {
            deletedAt: null
          }
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, ownerId: string, data: Partial<CreateProductCategoryDto>) {
    const category = await this.prisma.productCategory.findFirst({
      where: {
        id,
        ownerId,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (data.name) {
      const categoryWithSameName = await this.prisma.productCategory.findFirst({
        where: {
          name: data.name,
          ownerId,
          id: {
            not: id,
          },
        },
      });

      if (categoryWithSameName) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    const updatedCategory = await this.prisma.productCategory.update({
      where: {
        id,
      },
      data,
    });

    return updatedCategory;
  }

  async delete(id: string, ownerId: string) {
    const category = await this.prisma.productCategory.findFirst({
      where: {
        id,
        ownerId,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.prisma.productCategory.delete({
      where: {
        id,
      },
    });
  }
} 