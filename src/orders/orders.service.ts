import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto, OrderItemDto } from './dto/create-order.dto';

type OrderStatus = 'OPEN' | 'CLOSED' | 'ARCHIVED';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, data: CreateOrderDto) {
    // Start transaction since we might need to create a client
    return this.prisma.$transaction(async (tx) => {
      let clientId: string | undefined;

      if (data.clientInfo) {
        // Try to find existing client by phone
        const existingClient = await tx.client.findUnique({
          where: { phone: data.clientInfo.phone },
        });

        if (!existingClient && !data.clientInfo.name) {
          throw new NotFoundException(
            'Client not found. Please provide client name to create a new client.',
          );
        }

        if (!existingClient && data.clientInfo.name) {
          // Create new client
          const newClient = await tx.client.create({
            data: {
              name: data.clientInfo.name,
              phone: data.clientInfo.phone,
              profiles: {
                create: {
                  profile: {
                    connect: { id: ownerId },
                  },
                },
              },
            },
          });
          clientId = newClient.id;
        } else if (existingClient) {
          clientId = existingClient.id;
          
          // Ensure client is associated with the profile
          const profileClient = await tx.profileClient.findUnique({
            where: {
              profileId_clientId: {
                profileId: ownerId,
                clientId: existingClient.id,
              },
            },
          });

          if (!profileClient) {
            await tx.profileClient.create({
              data: {
                profile: {
                  connect: { id: ownerId },
                },
                client: {
                  connect: { id: existingClient.id },
                },
              },
            });
          }
        }
      }

      // Create order
      const order = await tx.order.create({
        data: {
          note: data.note,
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
      const orderClientId = order.clients[0]?.id;
      const products = await Promise.all(
        data.items.map((item) =>
          tx.product.findUnique({
            where: { id: item.productId },
            select: { price: true },
          }),
        ),
      );

      await tx.orderItem.createMany({
        data: data.items.map((item, index) => ({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          note: item.note,
          orderClientId: orderClientId,
          price: products[index]?.price ?? 0,
        })),
      });

      return this.findOne(order.id, ownerId);
    });
  }

  async findAll(ownerId: string) {
    return this.prisma.order.findMany({
      where: {
        ownerId,
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

  async updateStatus(id: string, ownerId: string, status: OrderStatus) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        ownerId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.order.update({
      where: { id },
      data: { status },
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
      },
    });

    if (!order) {
      throw new NotFoundException('Open order not found');
    }

    const orderClientId = order.clients[0]?.id;
    const products = await Promise.all(
      items.map((item) =>
        this.prisma.product.findUnique({
          where: { id: item.productId },
          select: { price: true },
        }),
      ),
    );

    await this.prisma.orderItem.createMany({
      data: items.map((item, index) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        note: item.note,
        orderClientId: orderClientId,
        price: products[index]?.price ?? 0,
      })),
    });

    return this.findOne(id, ownerId);
  }
} 