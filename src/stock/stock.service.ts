import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockDto, UpdateByInventoryDto, UpdateStockDto } from './dto/create-stock.dto';
import { StockHistoryType } from './history/dto/create-stock-history.dto';
import { UpdateBySaleDto } from './history/dto/update-stock-history-by-sale.dto';
import { StockHistoryService } from './history/stock-history.service';

@Injectable()
export class StockService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly stockHistoryService: StockHistoryService,
    ) { }

    async create(dto: CreateStockDto, ownerId: string) {
        const expense = await this.prisma.expense.findUnique({
            where: { id: dto.expenseId },
        });

        if (!expense) {
            throw new NotFoundException('Expense category not found');
        }

        const stock = await this.prisma.stock.create({
            data: {
                name: dto.name,
                quantity: dto.quantity,
                unitMeasure: dto.unitMeasure,
                unitPrice: dto.unitPrice,
                minStock: dto?.minStock,
                expenseId: dto.expenseId,
                totalAmountSpent: dto.totalPrice,
                totalQuantityPurchased: dto.quantity,
                ownerId,
            },
        });

        // Registrar entrada inicial no histórico
        await this.stockHistoryService.create({
            stockId: stock.id,
            type: StockHistoryType.INCOMING,
            initialQuantity: 0,
            finalQuantity: dto.quantity,
            description: 'Entrada inicial',
            totalPrice: dto.totalPrice,
            unitPrice: dto.unitPrice,
        });

        return stock;
    }

    async findAll(ownerId: string) {
        return this.prisma.stock.findMany({
            where: { ownerId },
            include: {
                expense: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
            },
            orderBy: {
                name: 'asc',
            },
        });
    }

    async findOne(id: string, ownerId: string) {
        const stock = await this.prisma.stock.findFirst({
            where: { id, ownerId },
            include: {
                expense: true,
            },
        });

        if (!stock) {
            throw new NotFoundException('Stock item not found');
        }

        return stock;
    }

    async update(id: string, dto: UpdateStockDto, ownerId: string) {
        const currentStock = await this.findOne(id, ownerId);
        const updatedStock = await this.prisma.stock.update({
            where: { id },
            data: {
                name: dto.name,
                quantity: {
                    increment: dto.quantity ?? 0,
                },
                unitPrice: dto.unitPrice,
                expenseId: dto.expenseId,
                minStock: dto.minStock,
                totalAmountSpent: { increment: dto.totalPrice ?? 0 },
                totalQuantityPurchased: { increment: dto.quantity ?? 0 },
            },
        });

        // Se a quantidade foi alterada, registrar no histórico
        if (dto.quantity && currentStock.quantity !== dto.quantity) {
            const unitPrice = parseFloat((updatedStock.totalAmountSpent / updatedStock.totalQuantityPurchased).toFixed(2));
            await this.stockHistoryService.create({
                stockId: id,
                type: StockHistoryType.INCOMING,
                initialQuantity: currentStock.quantity,
                finalQuantity: currentStock.quantity + dto.quantity,
                description: 'Adicionado manualmente',
                totalPrice: dto.totalPrice,
                unitPrice: unitPrice,
            });
        }

        return updatedStock;
    }

    async remove(id: string, ownerId: string) {
        await this.findOne(id, ownerId);

        return this.prisma.stock.delete({
            where: { id },
        });
    }

    async updateByInventory(dto: UpdateByInventoryDto, ownerId: string) {

        for (const item of dto.items) {
            const stock = await this.findOne(item.itemId, ownerId);

            if (!stock) {
                throw new NotFoundException('Stock item not found');
            }

            await this.prisma.stock.update({
                where: { id: stock.id },
                data: {
                    quantity: item.quantity,
                },
            });

            await this.stockHistoryService.create({
                stockId: stock.id,
                type: StockHistoryType.INVENTORY,
                initialQuantity: stock.quantity,
                finalQuantity: item.quantity,
                description: 'Inventário',
            });
        }
    }

    async updateStockBySale(productId: string, dto: UpdateBySaleDto, ownerId: string) {

        const stockProduct = await this.prisma.stockProduct.findFirst({
            where: {
                productId,
                stock: {
                    ownerId,
                },
            },
            include: {
                stock: true,
                product: {
                    select: {
                        name: true,
                    }
                }
            },
        });

        if (!stockProduct) {
            return
        }

        const quantityToDecrement = stockProduct.quantity * dto.quantity;

        const updatedStock = await this.prisma.stock.update({
            where: { id: stockProduct.stockId },
            data: {
                quantity: {
                    decrement: quantityToDecrement,
                },
            },
        });

        // Registrar saída no histórico
        await this.stockHistoryService.create({
            stockId: stockProduct.stockId,
            type: StockHistoryType.OUTGOING,
            initialQuantity: stockProduct.stock.quantity,
            finalQuantity: updatedStock.quantity,
            description: `Venda - ${stockProduct.product.name}`,
        });

        return updatedStock;
    }
} 