import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BillRecurrence, BillStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';

export interface BillFilters {
    status?: BillStatus;
    startDate?: string;
    endDate?: string;
    expenseId?: string;
}

@Injectable()
export class BillsService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(ownerId: string, filters: BillFilters) {
        const where: any = { ownerId };

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.startDate || filters.endDate) {
            where.dueDate = {};
            if (filters.startDate) {
                where.dueDate.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                where.dueDate.lte = new Date(filters.endDate + 'T23:59:59.999Z');
            }
        }

        if (filters.expenseId) {
            where.expenseId = filters.expenseId;
        }

        return this.prisma.bill.findMany({
            where,
            include: {
                expense: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: [
                { status: 'asc' }, // PENDING first, then PAID, then CANCELLED
                { dueDate: 'asc' },
            ],
        });
    }

    async findOne(id: string, ownerId: string) {
        const bill = await this.prisma.bill.findFirst({
            where: { id, ownerId },
            include: {
                expense: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                recurrenceParent: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                recurrenceChildren: {
                    select: {
                        id: true,
                        name: true,
                        dueDate: true,
                        status: true,
                    },
                    orderBy: { dueDate: 'asc' },
                },
            },
        });

        if (!bill) {
            throw new HttpException('Bill not found', HttpStatus.NOT_FOUND);
        }

        return bill;
    }

    async create(ownerId: string, data: CreateBillDto) {
        return this.prisma.bill.create({
            data: {
                name: data.name,
                amount: data.amount,
                dueDate: new Date(data.dueDate),
                notes: data.notes,
                recurrence: data.recurrence || BillRecurrence.NONE,
                expenseId: data.expenseId,
                ownerId,
            },
            include: {
                expense: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    async update(id: string, ownerId: string, data: UpdateBillDto) {
        const bill = await this.prisma.bill.findFirst({
            where: { id, ownerId },
        });

        if (!bill) {
            throw new HttpException('Bill not found', HttpStatus.NOT_FOUND);
        }

        return this.prisma.bill.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.amount && { amount: data.amount }),
                ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
                ...(data.notes !== undefined && { notes: data.notes }),
                ...(data.status && { status: data.status }),
                ...(data.recurrence && { recurrence: data.recurrence }),
                ...(data.expenseId !== undefined && { expenseId: data.expenseId }),
            },
            include: {
                expense: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    async pay(id: string, ownerId: string) {
        const bill = await this.prisma.bill.findFirst({
            where: { id, ownerId },
        });

        if (!bill) {
            throw new HttpException('Bill not found', HttpStatus.NOT_FOUND);
        }

        if (bill.status !== BillStatus.PENDING) {
            throw new HttpException('Only pending bills can be paid', HttpStatus.BAD_REQUEST);
        }

        // Mark the bill as paid
        const paidBill = await this.prisma.bill.update({
            where: { id },
            data: {
                status: BillStatus.PAID,
                paidAt: new Date(),
            },
            include: {
                expense: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // If it's a recurring bill, create the next occurrence
        if (bill.recurrence !== BillRecurrence.NONE) {
            await this.createNextRecurrence(bill, ownerId);
        }

        return paidBill;
    }

    async delete(id: string, ownerId: string) {
        const bill = await this.prisma.bill.findFirst({
            where: { id, ownerId },
        });

        if (!bill) {
            throw new HttpException('Bill not found', HttpStatus.NOT_FOUND);
        }

        return this.prisma.bill.delete({
            where: { id },
        });
    }

    async cancel(id: string, ownerId: string) {
        const bill = await this.prisma.bill.findFirst({
            where: { id, ownerId },
        });

        if (!bill) {
            throw new HttpException('Bill not found', HttpStatus.NOT_FOUND);
        }

        if (bill.status !== BillStatus.PENDING) {
            throw new HttpException('Only pending bills can be cancelled', HttpStatus.BAD_REQUEST);
        }

        return this.prisma.bill.update({
            where: { id },
            data: {
                status: BillStatus.CANCELLED,
            },
            include: {
                expense: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    private async createNextRecurrence(bill: any, ownerId: string) {
        const nextDueDate = new Date(bill.dueDate);

        if (bill.recurrence === BillRecurrence.WEEKLY) {
            nextDueDate.setDate(nextDueDate.getDate() + 7);
        } else if (bill.recurrence === BillRecurrence.MONTHLY) {
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        }

        // Use the original parent if this bill already has a parent, otherwise use this bill as the parent
        const parentId = bill.recurrenceParentId || bill.id;

        return this.prisma.bill.create({
            data: {
                name: bill.name,
                amount: bill.amount,
                dueDate: nextDueDate,
                notes: bill.notes,
                recurrence: bill.recurrence,
                recurrenceParentId: parentId,
                expenseId: bill.expenseId,
                ownerId,
            },
        });
    }
}
