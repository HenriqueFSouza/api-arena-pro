import { Injectable, NotFoundException } from '@nestjs/common';
import { CashRegisterService } from 'src/cash-register/cash-register.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { StockService } from 'src/stock/stock.service';
import { CreateOrderDto, OrderItemDto } from './dto/create-order.dto';

enum OrderStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private cashRegisterService: CashRegisterService,
    private stockService: StockService,
  ) { }

  async create(ownerId: string, data: CreateOrderDto) {

    let clientId: string | undefined;

    if (data.clientInfo && data.clientInfo.phone) {
      // Try to find existing client by phone
      const existingClient = await this.prisma.client.findUnique({
        where: { phone: data.clientInfo.phone },
      });

      if (!existingClient && !data.clientInfo.name) {
        throw new NotFoundException(
          'Client not found. Please provide client name to create a new client.',
        );
      }

      if (!existingClient && data.clientInfo.name) {
        // Create new client
        const newClient = await this.prisma.client.create({
          data: {
            name: data.clientInfo.name,
            phone: data.clientInfo.phone,
          },
        });
        clientId = newClient.id;
      } else if (existingClient) {
        clientId = existingClient.id;
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          note: data.note,
          ...(!clientId && { clientsData: [{ name: data.clientInfo?.name }] }),
          owner: {
            connect: { id: ownerId },
          },
          ...(clientId && {
            clients: {
              create: {
                client: {
                  connect: { id: clientId },
                },
              },
            },
          }),
        },
        include: {
          clients: {
            include: {
              client: true,
            },
          },
        },
      });

      // Create order items with product prices
      if (data.items.length > 0) {
        const orderClientId = order.clients[0]?.id || null;

        // Fetch all products in a single query instead of multiple promises
        const productIds = data.items.map(item => item.productId);
        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, price: true },
        });

        // Create a map for faster lookups
        const productPriceMap = new Map(
          products.map(product => [product.id, product.price])
        );

        await tx.orderItem.createMany({
          data: data.items.map((item) => ({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            note: item.note,
            orderClientId: orderClientId,
            price: productPriceMap.get(item.productId) ?? 0,
          })),
        });
      }
    });
  }

  async findAll(ownerId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        ownerId,
        status: 'OPEN',
      },
      include: {
        clients: {
          include: {
            client: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const mappedOrders = orders.map((order) => {
      const isOrderClient = order.clients.length > 0;
      const clients = isOrderClient ? { ...order.clients[0].client, orderClientId: order.clients[0].id } : order.clientsData[0];

      delete order.clientsData;
      return {
        ...order,
        clients: [clients],
        items: order.items.map((item) => ({
          ...item,
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            categoryId: item.product.categoryId,
          },
        })),
      }
    });

    return mappedOrders;
  }

  async findOne(id: string, ownerId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        ownerId,
      },
      include: {
        clients: {
          include: {
            client: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        items: {
          include: {
            product: true,
            orderClient: {
              include: {
                client: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async closeOrder(id: string, ownerId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        ownerId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CLOSED }
      });

      // Create cash register transactions
      await this.cashRegisterService.createPaymentTransactions(id, ownerId);

      // Update stock
      for (const item of order.items) {
        await this.stockService.updateStockBySale(item.productId, {
          quantity: item.quantity,
        }, ownerId);
      }
    });
  }

  async addItems(id: string, ownerId: string, items: OrderItemDto[]) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        ownerId,
        status: 'OPEN',
      },
      include: {
        clients: true,
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Open order not found');
    }

    const orderClientId = order.clients[0]?.id;

    const existingItemsMap = new Map(
      order.items.map(item => [item.productId, item])
    );

    const itemsToCreate: any[] = [];
    const itemsToUpdate: any[] = [];

    const newProductIds = items
      .filter(item => !existingItemsMap.has(item.productId))
      .map(item => item.productId);

    const newProducts = newProductIds.length > 0
      ? await this.prisma.product.findMany({
        where: { id: { in: newProductIds } },
        select: { id: true, price: true },
      })
      : [];

    const productPriceMap = new Map(
      newProducts.map(product => [product.id, product.price])
    );

    for (const item of items) {
      const existingItem = existingItemsMap.get(item.productId);

      if (existingItem) {
        itemsToUpdate.push({
          id: existingItem.id,
          quantity: item.quantity + existingItem.quantity,
          note: item.note || existingItem.note,
        });
      } else {
        itemsToCreate.push({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          note: item.note,
          orderClientId: orderClientId,
          price: productPriceMap.get(item.productId) ?? 0,
        });
      }
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of itemsToUpdate) {
        await tx.orderItem.update({
          where: { id: item.id },
          data: {
            quantity: item.quantity,
            note: item.note,
          },
        });
      }

      if (itemsToCreate.length > 0) {
        await tx.orderItem.createMany({
          data: itemsToCreate,
        });
      }
    });
  }

  async removeItem(id: string, ownerId: string, itemId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, ownerId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.prisma.orderItem.delete({
      where: { id: itemId },
    });
  }

  async deleteOrder(id: string, ownerId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, ownerId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.prisma.order.delete({
      where: { id },
    });
  }
} 