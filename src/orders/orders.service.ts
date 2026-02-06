import { Injectable, NotFoundException } from "@nestjs/common";
import { CashRegisterService } from "src/cash-register/cash-register.service";
import { PrismaService } from "src/prisma/prisma.service";
import { StockService } from "src/stock/stock.service";
import { CreateOrderDto, OrderItemDto } from "./dto/create-order.dto";
import { ordersMapper } from "./orders.mapers";

enum OrderStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  ARCHIVED = "ARCHIVED",
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private cashRegisterService: CashRegisterService,
    private stockService: StockService
  ) {}

  async create(ownerId: string, data: CreateOrderDto) {
    let clientId: string | undefined;

    if (data.clientInfo && data.clientInfo.phone) {
      // Try to find existing client by phone
      const existingClient = await this.prisma.client.findUnique({
        where: { phone: data.clientInfo.phone },
      });

      if (!existingClient && !data.clientInfo.name) {
        throw new NotFoundException(
          "Client not found. Please provide client name to create a new client."
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

    const order = await this.prisma.$transaction(async (tx) => {
      // Create order
      const createdOrder = await tx.order.create({
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
        const orderClientId = createdOrder.clients[0]?.id || null;

        // Fetch all products in a single query instead of multiple promises
        const productIds = data.items.map((item) => item.productId);
        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, price: true },
        });

        // Create a map for faster lookups
        const productPriceMap = new Map(
          products.map((product) => [product.id, product.price])
        );

        await tx.orderItem.createMany({
          data: data.items.map((item) => ({
            orderId: createdOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            note: item.note,
            orderClientId: orderClientId,
            price: productPriceMap.get(item.productId) ?? 0,
          })),
        });
      }

      return tx.order.findUnique({
        where: { id: createdOrder.id },
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
    });

    return ordersMapper(order);
  }

  async findAll(ownerId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        ownerId,
        status: "OPEN",
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
        createdAt: "desc",
      },
    });

    return ordersMapper(orders);
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
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
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
      throw new NotFoundException("Order not found");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CLOSED },
      });

      // Create cash register transactions
      await this.cashRegisterService.createPaymentTransactions(id, ownerId);

      // Update stock
      for (const item of order.items) {
        await this.stockService.updateStockBySale(
          item.productId,
          {
            quantity: item.quantity,
          },
          ownerId
        );
      }
    });
  }

  async addItems(id: string, ownerId: string, items: OrderItemDto[]) {
    // Validate order exists and is open - optimized query with select
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        ownerId,
        status: "OPEN",
      },
      select: {
        id: true,
        items: {
          select: {
            id: true,
            productId: true,
            note: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException("Open order not found");
    }

    const orderClientId = items.find(
      (item) => item.orderClientId
    )?.orderClientId;

    const existingItemsMap = new Map(
      order.items.map((item) => [item.productId, item])
    );

    const itemsToCreate: any[] = [];
    const itemsToUpdate: any[] = [];

    // Separate items into create/update operations
    for (const item of items) {
      const existingItem = existingItemsMap.get(item.productId);

      if (existingItem) {
        itemsToUpdate.push({
          id: existingItem.id,
          quantity: item.quantity,
          note: item.note || existingItem.note,
        });
      } else {
        itemsToCreate.push({
          productId: item.productId,
          quantity: item.quantity,
          note: item.note,
          orderClientId,
        });
      }
    }

    // Fetch prices only for new products (if any)
    const productPriceMap =
      itemsToCreate.length > 0
        ? new Map(
            (
              await this.prisma.product.findMany({
                where: { id: { in: itemsToCreate.map((i) => i.productId) } },
                select: { id: true, price: true },
              })
            ).map((product) => [product.id, product.price])
          )
        : new Map();

    // Execute all operations in parallel within transaction for better performance
    await this.prisma.$transaction([
      // Parallel updates - each update runs independently
      ...itemsToUpdate.map((item) =>
        this.prisma.orderItem.update({
          where: { id: item.id },
          data: {
            quantity: item.quantity,
            note: item.note,
          },
        })
      ),
      // Batch create new items
      ...(itemsToCreate.length > 0
        ? [
            this.prisma.orderItem.createMany({
              data: itemsToCreate.map((item) => ({
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                note: item.note,
                orderClientId: item.orderClientId,
                price: productPriceMap.get(item.productId) ?? 0,
              })),
            }),
          ]
        : []),
    ]);

    // Return only newly created items for frontend cache merge
    // Updated items are already correct via optimistic update, so no need to return them
    if (itemsToCreate.length === 0) {
      return { newItems: [] };
    }

    // Fetch only the newly created items with full product data
    const newItems = await this.prisma.orderItem.findMany({
      where: {
        orderId: order.id,
        productId: {
          in: itemsToCreate.map((i) => i.productId),
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            categoryId: true,
          },
        },
      },
    });

    // Map to match frontend format
    return {
      newItems: newItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        note: item.note,
        orderClientId: item.orderClientId,
        price: item.price,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          categoryId: item.product.categoryId,
        },
      })),
    };
  }

  async removeItem(id: string, ownerId: string, itemId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, ownerId },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
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
      throw new NotFoundException("Order not found");
    }

    await this.prisma.order.delete({
      where: { id },
    });
  }
}
