import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Decimal, JsonValue } from '@prisma/client/runtime/library';
import { dateNowWithTimezone } from 'src/utils/date';
import { PrismaService } from '../prisma/prisma.service';
import { CloseCashRegisterDto } from './dto/close-cash-register.dto';
import { CreateTransactionDto, TransactionOriginType } from './dto/create-transaction.dto';
import { OpenCashRegisterDto } from './dto/open-cash-register.dto';

interface ClientData {
    name: string;
    [key: string]: any;
}

interface PaymentInfo {
    amount: Decimal | string | number;
    paymentMethod: string;
}

export interface Sale {
    orderId: string;
    clientName: string | null;
    payments: PaymentInfo[];
    createdAt: Date;
}

@Injectable()
export class CashRegisterService {
    constructor(private prisma: PrismaService) { }

    async openCashRegister(dto: OpenCashRegisterDto, ownerId: string) {
        const openCashRegister = await this.prisma.cashRegister.findFirst({
            where: { ownerId, closedAt: null },
        });

        if (openCashRegister) {
            throw new HttpException('There is already an open cash register', HttpStatus.BAD_REQUEST);
        }

        return this.prisma.cashRegister.create({
            data: {
                ownerId,
                openedAmount: dto.amount,
                expectedAmount: dto.amount,
                registeredPayments: [],
            },
        });
    }

    async getCurrentCashRegister(data: { ownerId?: string, cashRegisterId?: string }) {
        const cashRegister = await this.prisma.cashRegister.findFirst({
            where: { OR: [{ ownerId: data.ownerId }, { id: data.cashRegisterId }], closedAt: null },
            include: {
                transactions: true,
            },
        });

        if (!cashRegister) {
            throw new HttpException('No open cash register found', HttpStatus.NOT_FOUND);
        }

        return cashRegister;
    }

    async createTransaction(dto: CreateTransactionDto, ownerId: string) {
        const currentCashRegister = await this.getCurrentCashRegister({ ownerId });

        const transaction = await this.prisma.transaction.create({
            data: {
                ...dto,
                amount: parseFloat(dto.amount.toString()),
                cashRegisterId: currentCashRegister.id,
            },
        });

        return transaction;
    }

    async createPaymentTransactions(orderId: string, ownerId: string) {
        const orderPayments = await this.prisma.payment.findMany({
            where: { orderId },
        });

        for (const payment of orderPayments) {
            await this.createTransaction({
                amount: parseFloat(payment.amount.toString()),
                originType: TransactionOriginType.PAYMENT,
                originId: payment.id,
                paymentMethod: payment.method,
            }, ownerId);
        }
    }

    async registerPayments(dto: CloseCashRegisterDto, cashRegisterId: string) {
        const currentCashRegister = await this.getCurrentCashRegister({ cashRegisterId });

        if (!currentCashRegister) {
            throw new HttpException('Cash register not found', HttpStatus.NOT_FOUND);
        }

        const totalByPaymentMethod = dto.registeredPayments.reduce(
            (acc, curr) => acc + curr.amount,
            0,
        );

        return this.prisma.cashRegister.update({
            where: { id: currentCashRegister.id },
            data: {
                closedAmount: totalByPaymentMethod,
                registeredPayments: dto.registeredPayments as unknown as JsonValue,
            }
        });
    }

    async closeCashRegister(cashRegisterId: string) {
        const currentCashRegister = await this.getCurrentCashRegister({ cashRegisterId });

        if (!currentCashRegister) {
            throw new HttpException('Cash register not found', HttpStatus.NOT_FOUND);
        }

        const finalDate = dateNowWithTimezone();

        return this.prisma.cashRegister.update({
            where: { id: currentCashRegister.id },
            data: {
                closedAt: finalDate,
            }
        });
    }

    async getCashRegisterReport(cashRegisterId: string) {
        const cashRegister = await this.prisma.cashRegister.findUnique({
            where: { id: cashRegisterId },
            include: {
                transactions: true,
            },
        });

        if (!cashRegister) {
            throw new HttpException('Cash register not found', HttpStatus.NOT_FOUND);
        }

        const transactions = cashRegister.transactions;

        const report = {
            openedAmount: cashRegister.openedAmount,
            expectedAmount: cashRegister.expectedAmount,
            closedAmount: cashRegister.closedAmount,
            difference: cashRegister.closedAmount
                ? cashRegister.closedAmount - cashRegister.expectedAmount
                : null,
            registeredPayments: cashRegister.registeredPayments,
            totals: {
                orders: transactions
                    .filter((t) => t.originType === TransactionOriginType.PAYMENT)
                    .reduce((acc, curr) => acc + curr.amount, 0),
                expenses: transactions
                    .filter((t) => t.originType === TransactionOriginType.EXPENSE)
                    .reduce((acc, curr) => acc + curr.amount, 0),
                increments: transactions
                    .filter((t) => t.originType === TransactionOriginType.INCREMENT)
                    .reduce((acc, curr) => acc + curr.amount, 0),
            },
        };

        return report;
    }

    async getCashRegisterSales(cashRegisterId: string) {
        const cashRegisterTransactions = await this.prisma.transaction.findMany({
            where: { cashRegisterId },
            select: {
                originType: true,
                originId: true,
            },
        });

        if (!cashRegisterTransactions) {
            throw new HttpException('Cash register not found', HttpStatus.NOT_FOUND);
        }

        const sales = cashRegisterTransactions.filter((t) => t.originType === TransactionOriginType.PAYMENT);

        const payments = await this.prisma.payment.findMany({
            where: {
                id: {
                    in: sales.map((s) => s.originId),
                },
            },
            include: {
                order: {
                    select: {
                        clientsData: true,
                        clients: {
                            select: {
                                client: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Group payments by orderId
        const salesMap = payments.reduce((acc, payment) => {
            const { order, orderId, amount, method, createdAt } = payment;
            const clientsData = order.clientsData as ClientData[] | null;
            const clientName = Array.isArray(clientsData) && clientsData.length
                ? clientsData[0].name
                : order.clients?.[0]?.client?.name || null;

            if (!acc[orderId]) {
                acc[orderId] = {
                    orderId,
                    clientName,
                    payments: [],
                    createdAt,
                };
            }

            acc[orderId].payments.push({
                amount,
                paymentMethod: method,
            });

            return acc;
        }, {} as Record<string, Sale>);

        // Convert map to array and sort by createdAt
        return Object.values(salesMap).sort((a, b) =>
            b.createdAt.getTime() - a.createdAt.getTime()
        );
    }
} 