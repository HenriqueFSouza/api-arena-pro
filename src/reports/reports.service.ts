import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface SalesReportData {
    monthlyStats: Array<{
        month: string;
        totalSales: number;
        totalOrders: number;
    }>;
    paymentMethodStats: Array<{
        method: PaymentMethod;
        totalAmount: number;
        orderCount: number;
    }>;
    dayOfWeekStats: Array<{
        dayOfWeek: string;
        averageSales: number;
        orderCount: number;
        dayOccurrences: number;
    }>;
    topProducts: Array<{
        productId: string;
        imageUrl: string;
        productName: string;
        totalSold: number;
        revenue: number;
    }>;
    totalOrders: number;
    totalProfit: number;
    averageOrderValue: number;
}

export type ReportPeriod = 'current' | 'month' | '3months' | '6months' | 'year';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    async getSalesReport(ownerId: string, period: ReportPeriod, startDate?: string, endDate?: string): Promise<SalesReportData> {
        const dateRange = this.getDateRange(period, startDate, endDate);
        console.log('VALUES', { dateRange });

        // Get all payments in the date range
        const payments = await this.prisma.payment.findMany({
            where: {
                order: {
                    ownerId,
                },
                status: 'COMPLETED',
                createdAt: {
                    gte: dateRange.start,
                    lte: dateRange.end,
                },
            },
            include: {
                order: {
                    include: {
                        items: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        imageUrl: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Calculate monthly stats
        const monthlyStats = this.calculateMonthlyStats(payments, dateRange);

        // Calculate payment method stats
        const paymentMethodStats = this.calculatePaymentMethodStats(payments);

        // Calculate day of week stats
        const dayOfWeekStats = this.calculateDayOfWeekStats(payments, dateRange);

        // Calculate top products
        const topProducts = this.calculateTopProducts(payments);

        // Calculate summary metrics
        const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
        const totalOrders = new Set(payments.map(p => p.orderId)).size;
        const averageOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0;

        return {
            monthlyStats,
            paymentMethodStats,
            dayOfWeekStats,
            topProducts,
            totalOrders,
            totalProfit: totalAmount,
            averageOrderValue,
        };
    }

    private getDateRange(period: ReportPeriod, startDate?: string, endDate?: string) {
        let end = endDate ? new Date(endDate) : new Date();
        let start: Date;

        if (startDate) {
            start = new Date(startDate);
        } else {
            switch (period) {
                case 'current':
                    start = new Date();
                    start.setDate(1); // Set to first day of current month
                    start.setHours(0, 0, 0, 0);
                    break;
                case 'month':
                    start = new Date();
                    start.setMonth(start.getMonth() - 1);
                    break;
                case '3months':
                    start = new Date();
                    start.setMonth(start.getMonth() - 3);
                    start.setDate(1);
                    start.setHours(0, 0, 0, 0);
                    break;
                case '6months':
                    start = new Date();
                    start.setMonth(start.getMonth() - 6);
                    break;
                case 'year':
                    start = new Date();
                    start.setFullYear(start.getFullYear() - 1);
                    break;
            }
        }
        start = new Date(start.toISOString().split('T')[0] + 'T00:00:00.000Z');
        end = new Date(end.toISOString().split('T')[0] + 'T23:59:59.999Z');
        return { start, end };
    }

    private calculateMonthlyStats(payments: any[], dateRange: { start: Date; end: Date }) {
        const monthlyData = new Map<string, { totalSales: number; orderIds: Set<string> }>();

        payments.forEach(payment => {
            const month = new Date(payment.createdAt).toISOString().slice(0, 7); // YYYY-MM
            const existing = monthlyData.get(month) || { totalSales: 0, orderIds: new Set() };

            existing.totalSales += Number(payment.amount);
            existing.orderIds.add(payment.orderId);

            monthlyData.set(month, existing);
        });

        return Array.from(monthlyData.entries())
            .map(([month, data]) => ({
                month,
                totalSales: data.totalSales,
                totalOrders: data.orderIds.size,
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }

    private calculatePaymentMethodStats(payments: any[]) {
        const methodData = new Map<PaymentMethod, { totalAmount: number; orderIds: Set<string> }>();

        payments.forEach(payment => {
            const existing = methodData.get(payment.method) || { totalAmount: 0, orderIds: new Set() };
            existing.totalAmount += Number(payment.amount);
            existing.orderIds.add(payment.orderId);
            methodData.set(payment.method, existing);
        });

        return Array.from(methodData.entries()).map(([method, data]) => ({
            method,
            totalAmount: data.totalAmount,
            orderCount: data.orderIds.size,
        }));
    }

    private calculateDayOfWeekStats(payments: any[], dateRange: { start: Date; end: Date }) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayData = new Map<number, { totalSales: number; orderIds: Set<string> }>();

        // Calculate day occurrences in the date range
        const dayOccurrences = this.calculateDayOccurrences(dateRange.start, dateRange.end);

        payments.forEach(payment => {
            const dayOfWeek = new Date(payment.createdAt).getDay();
            const existing = dayData.get(dayOfWeek) || { totalSales: 0, orderIds: new Set() };

            existing.totalSales += Number(payment.amount);
            existing.orderIds.add(payment.orderId);

            dayData.set(dayOfWeek, existing);
        });

        return dayNames.map((dayName, index) => {
            const data = dayData.get(index) || { totalSales: 0, orderIds: new Set() };
            const occurrences = dayOccurrences[index];
            return {
                dayOfWeek: dayName,
                averageSales: occurrences > 0 ? data.totalSales / occurrences : 0,
                orderCount: data.orderIds.size,
                dayOccurrences: occurrences,
            };
        });
    }

    private calculateDayOccurrences(startDate: Date, endDate: Date): number[] {
        const dayOccurrences = [0, 0, 0, 0, 0, 0, 0]; // Sunday = 0, Monday = 1, ..., Saturday = 6

        const currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        while (currentDate <= end) {
            const dayOfWeek = currentDate.getDay();
            dayOccurrences[dayOfWeek]++;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dayOccurrences;
    }

    private calculateTopProducts(payments: any[]) {
        const productData = new Map<string, { imageUrl: string; name: string; totalSold: number; revenue: number }>();

        payments.forEach(payment => {
            payment.order.items.forEach((item: any) => {
                if (!item.product) return;

                const productId = item.product.id;
                const existing = productData.get(productId) || {
                    imageUrl: item.product.imageUrl,
                    name: item.product.name,
                    totalSold: 0,
                    revenue: 0
                };

                existing.totalSold += item.quantity;
                existing.revenue += Number(item.price) * item.quantity;

                productData.set(productId, existing);
            });
        });

        return Array.from(productData.entries())
            .map(([productId, data]) => ({
                productId,
                imageUrl: data.imageUrl,
                productName: data.name,
                totalSold: data.totalSold,
                revenue: data.revenue,
            }))
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, 10);
    }
} 