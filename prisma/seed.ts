import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultExpenses = [
    { name: 'Aluguel' },
    { name: 'Energia' },
    { name: 'Água' },
    { name: 'Internet' },
    { name: 'Funcionários' },
    { name: 'Combustível' },
    { name: 'Açougue' },

    // Materiais e Suprimentos
    { name: 'Materiais de Limpeza' },
    { name: 'Materiais de Escritório' },

    // Manutenção
    { name: 'Manutenção de Equipamentos' },
    { name: 'Manutenção Predial' },

    // Marketing e Divulgação
    { name: 'Marketing Digital' },
    { name: 'Material Promocional' },
    { name: 'Eventos e Promoções' },

    // Serviços
    { name: 'Sistema de Gestão' },
    { name: 'Contabilidade' },
    { name: 'Segurança' },

    // Estoque e Insumos
    { name: 'Bebidas' },
    { name: 'Alimentos' },
    { name: 'Gás de Cozinha' },
    { name: 'Gelo' },
]

async function main() {
    for (const expense of defaultExpenses) {
        // Verifica se a despesa já existe antes de criar
        const existingExpense = await prisma.expense.findFirst({
            where: {
                name: expense.name,
                ownerId: null // Apenas despesas padrão (sem owner)
            }
        })

        if (!existingExpense) {
            await prisma.expense.create({
                data: expense
            })
        }
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
