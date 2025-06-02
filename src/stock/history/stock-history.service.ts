import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStockHistoryDto } from './dto/create-stock-history.dto';

@Injectable()
export class StockHistoryService {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: CreateStockHistoryDto) {
        return this.prisma.stockHistory.create({
            data: {
                stockId: data.stockId,
                type: data.type,
                initialQuantity: data.initialQuantity,
                finalQuantity: data.finalQuantity,
                description: data.description,
                totalPrice: data.totalPrice,
                unitPrice: data.unitPrice,
            },
            include: {
                stock: true,
            },
        });
    }

    async findByStockId(stockId: string) {
        return this.prisma.stockHistory.findMany({
            where: {
                stockId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                stock: {
                    select: {
                        unitMeasure: true,
                    },
                },
            },
        });
    }

    async getStockMovements(stockId: string, startDate?: Date, endDate?: Date) {
        const where = {
            stockId,
            ...(startDate || endDate
                ? {
                    createdAt: {
                        ...(startDate && { gte: startDate }),
                        ...(endDate && { lte: endDate }),
                    },
                }
                : {}),
        };

        return this.prisma.stockHistory.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                stock: {
                    include: {
                        expense: true,
                    },
                },
            },
        });
    }
} 