import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

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

    const product = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          quantity: data.quantity,
          imageUrl: data.imageUrl,
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

      if (data.stockProduct && data.stockProduct.length > 0) {
        await tx.stockProduct.createMany({
          data: data.stockProduct.map(stockProduct => ({
            productId: product.id,
            stockId: stockProduct.stockId,
            quantity: stockProduct.quantity
          }))
        });
      }

      return product;
    });

    return product;
  }

  async findAll(ownerId: string, categoryId: string, search: string) {
    const products = await this.prisma.product.findMany({
      where: {
        owner: {
          id: ownerId
        },
        ...(categoryId && {
          categoryId: categoryId
        }),
        ...(search && {
          name: { contains: search, mode: 'insensitive' }
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
        category: true,
        stockProduct: {
          select: {
            stockId: true,
            quantity: true
          }
        }
      }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      ...product,
      ...(product.stockProduct.length > 0 ? { stockProduct: product.stockProduct } : { stockProduct: undefined })
    };
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

    const updatedProduct = await this.prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          quantity: data.quantity,
          imageUrl: data.imageUrl,
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

      if (data.stockProduct) {
        const hasItemsToAdd = data.stockProduct.length > 0;

        if (hasItemsToAdd) {
          await tx.stockProduct.createMany({
            data: data.stockProduct.map(stockProduct => ({
              productId: id,
              stockId: stockProduct.stockId,
              quantity: stockProduct.quantity
            }))
          });
        } else {
          await tx.stockProduct.deleteMany({
            where: { productId: id }
          });
        }
      }
      return updatedProduct;
    });

    return updatedProduct;
  }

  async delete(id: string, ownerId: string) {
    const product = await this.prisma.product.findUnique({
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
      where: { id, ownerId }
    });
  }
} 