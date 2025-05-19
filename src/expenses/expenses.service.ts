import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(userId: string, query: string | undefined) {
        // Busca todas as despesas do sistema (sem ownerId) e as despesas específicas do usuário
        return this.prisma.expense.findMany({
            where: {
                OR: [
                    { ownerId: null }, // Despesas padrão do sistema
                    { ownerId: userId }, // Despesas do usuário
                ],
                name: {
                    contains: query,
                    mode: 'insensitive',
                },
            },
            orderBy: {
                name: 'asc',
            },
        });
    }

    async create(data: CreateExpenseDto & { ownerId: string }) {
        return this.prisma.expense.create({
            data,
        });
    }
} 