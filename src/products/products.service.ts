import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, data: CreateProductDto) {
    // Verify if category exists and belongs to owner
    const category = await this.prisma.productCategory.findFirst({
      where: {
        id: data.categoryId,
        owner: {
          id: ownerId
        }
      }
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const product = await this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        quantity: data.quantity,
        category: {
          connect: {
            id: data.categoryId
          }
        },
        owner: {
          connect: {
            id: ownerId
          }
        }
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return product;
  }

  async findAll(ownerId: string) {
    const products = await this.prisma.product.findMany({
      where: {
        owner: {
          id: ownerId
        }
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return products;
  }

  async findOne(id: string, ownerId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        owner: {
          id: ownerId
        }
      },
      include: {
        category: true
      }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, ownerId: string, data: Partial<CreateProductDto>) {
    // First check if product exists and belongs to owner
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        owner: {
          id: ownerId
        }
      }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // If categoryId is being updated, verify if new category exists and belongs to owner
    if (data.categoryId) {
      const category = await this.prisma.productCategory.findFirst({
        where: {
          id: data.categoryId,
          owner: {
            id: ownerId
          }
        }
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        quantity: data.quantity,
        ...(data.categoryId && {
          category: {
            connect: {
              id: data.categoryId
            }
          }
        })
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return updatedProduct;
  }

  async delete(id: string, ownerId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        owner: {
          id: ownerId
        }
      }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.delete({
      where: { id }
    });
  }
} 