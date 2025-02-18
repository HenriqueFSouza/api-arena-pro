import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(orderId: string, ownerId: string, data: CreatePaymentDto) {
    // Verify if order exists and belongs to owner
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        ownerId,
      },
      include: {
        clients: true,
        items: {
          include: {
            orderClient: true,
          },
        },
        payments: {
          where: {
            status: 'COMPLETED',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot add payments to archived orders');
    }

    // If orderClientId is provided, verify it belongs to this order
    if (data.orderClientId) {
      const orderClient = order.clients.find(
        (client) => client.id === data.orderClientId,
      );
      if (!orderClient) {
        throw new NotFoundException('Order client not found');
      }

      // Calculate total amount for this client
      const clientTotal = order.items
        .filter((item) => item.orderClientId === data.orderClientId)
        .reduce((sum, item) => sum + item.price.toNumber() * item.quantity, 0);

      // Calculate total paid for this client
      const clientPaid = order.payments
        .filter(
          (payment) =>
            payment.orderClientId === data.orderClientId &&
            payment.status === 'COMPLETED',
        )
        .reduce((sum, payment) => sum + payment.amount.toNumber(), 0);

      // Verify payment amount doesn't exceed remaining balance
      if (data.amount > clientTotal - clientPaid) {
        throw new BadRequestException(
          'Payment amount exceeds remaining balance for this client',
        );
      }
    } else {
      // Calculate total order amount
      const orderTotal = order.items.reduce(
        (sum, item) => sum + item.price.toNumber() * item.quantity,
        0,
      );

      // Calculate total paid
      const totalPaid = order.payments
        .filter((payment) => payment.status === 'COMPLETED')
        .reduce((sum, payment) => sum + payment.amount.toNumber(), 0);

      // Verify payment amount doesn't exceed remaining balance
      if (data.amount > orderTotal - totalPaid) {
        throw new BadRequestException('Payment amount exceeds remaining balance');
      }
    }

    // Create payment
    const payment = await this.prisma.payment.create({
      data: {
        amount: data.amount,
        method: data.method,
        note: data.note,
        status: 'COMPLETED',
        order: {
          connect: { id: orderId },
        },
        ...(data.orderClientId && {
          orderClient: {
            connect: { id: data.orderClientId },
          },
        }),
      },
      include: {
        orderClient: {
          include: {
            client: true,
          },
        },
      },
    });

    // Check if order is fully paid and update status
    await this.checkAndUpdateOrderStatus(orderId);

    return payment;
  }

  async findByOrder(orderId: string, ownerId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        ownerId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.payment.findMany({
      where: {
        orderId,
      },
      include: {
        orderClient: {
          include: {
            client: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async cancel(id: string, orderId: string, ownerId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id,
        orderId,
        order: {
          ownerId,
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'COMPLETED') {
      throw new BadRequestException('Can only cancel completed payments');
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
      include: {
        orderClient: {
          include: {
            client: true,
          },
        },
      },
    });

    // Update order status since payment was cancelled
    await this.checkAndUpdateOrderStatus(orderId);

    return updatedPayment;
  }

  private async checkAndUpdateOrderStatus(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: {
          where: {
            status: 'COMPLETED',
          },
        },
      },
    });

    if (!order) return;

    const orderTotal = order.items.reduce(
      (sum, item) => sum + item.price.toNumber() * item.quantity,
      0,
    );

    const totalPaid = order.payments.reduce(
      (sum, payment) => sum + payment.amount.toNumber(),
      0,
    );

    if (totalPaid >= orderTotal && order.status === 'OPEN') {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CLOSED',
        },
      });
    } else if (totalPaid < orderTotal && order.status === 'CLOSED') {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'OPEN',
        },
      });
    }
  }
} 