import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDiscountDto } from './dto/create-discount.dto';

@Injectable()
export class DiscountsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createDiscountDto: CreateDiscountDto, orderId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return this.prisma.discount.create({
            data: {
                value: createDiscountDto.value,
                reason: createDiscountDto.reason,
                orderId: orderId,
            },
        });
    }

    async remove(id: string) {
        const discount = await this.prisma.discount.findUnique({
            where: { id },
        });

        if (!discount) {
            throw new NotFoundException('Discount not found');
        }

        return this.prisma.discount.delete({
            where: { id },
        });
    }

    async findByOrderId(orderId: string) {
        const discounts = await this.prisma.discount.findMany({
            where: { orderId },
        });

        return discounts.map(discount => ({
            id: discount.id,
            value: discount.value.toNumber(),
            reason: discount.reason,
        }));
    }
} 