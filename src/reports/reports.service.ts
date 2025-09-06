import { Injectable } from "@nestjs/common";
import { PaymentMethod } from "@prisma/client";
import * as PDFDocument from "pdfkit";
import { PrismaService } from "../prisma/prisma.service";

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
  // topProducts: Array<{
  //     productId: string;
  //     imageUrl: string;
  //     productName: string;
  //     totalSold: number;
  //     revenue: number;
  // }>;
  totalOrders: number;
  totalProfit: number;
  averageOrderValue: number;
}

export interface SoldProduct {
  productId: string;
  productName: string;
  imageUrl?: string;
  quantitySold: number;
  price: number;
  productCost: number;
  revenue: number;
  profit: number;
}

export interface SoldProductsResponse {
  products: SoldProduct[];
  totalProducts: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
}

export type ReportPeriod =
  | "current"
  | "month"
  | "3months"
  | "6months"
  | "year"
  | "today";

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSalesReport(
    ownerId: string,
    period: ReportPeriod,
    startDate?: string,
    endDate?: string
  ): Promise<SalesReportData> {
    const dateRange = this.getDateRange(period, startDate, endDate);

    // Get all payments in the date range
    const payments = await this.prisma.payment.findMany({
      where: {
        order: {
          ownerId,
        },
        status: "COMPLETED",
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
    // const topProducts = this.calculateTopProducts(payments);

    // Calculate summary metrics
    const totalAmount = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );
    const totalOrders = new Set(payments.map((p) => p.orderId)).size;
    const averageOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0;

    return {
      monthlyStats,
      paymentMethodStats,
      dayOfWeekStats,
      // topProducts,
      totalOrders,
      totalProfit: totalAmount,
      averageOrderValue,
    };
  }

  async getSoldProducts(
    ownerId: string,
    startDate: string,
    endDate: string,
    page: number,
    limit: number
  ): Promise<SoldProductsResponse> {
    const dateRange = this.formatDateRange(startDate, endDate);
    const skip = (page - 1) * limit;

    // Get order items with their products and stock information
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          ownerId,
          status: "CLOSED",
        },
        product: {
          isNot: null,
        },
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      include: {
        product: {
          include: {
            stockProduct: {
              include: {
                stock: true,
              },
            },
          },
        },
      },
    });

    // Group products and calculate metrics
    const productMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        imageUrl?: string;
        quantitySold: number;
        totalRevenue: number;
        prices: number[];
        productCost: number;
      }
    >();

    for (const item of orderItems) {
      if (!item.product) continue;

      const productId = item.product.id;
      const existing = productMap.get(productId);

      // Calculate product cost from stock
      let productCost = 0;
      if (item.product.stockProduct && item.product.stockProduct.length > 0) {
        // Use the weighted average of all stock items related to this product
        const stockItems = item.product.stockProduct;
        const totalQuantity = stockItems.reduce(
          (sum, sp) => sum + sp.quantity,
          0
        );
        const totalCost = stockItems.reduce(
          (sum, sp) => sum + sp.quantity * Number(sp.stock.unitPrice),
          0
        );
        productCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
      }

      if (existing) {
        existing.quantitySold += item.quantity;
        existing.totalRevenue += Number(item.price) * item.quantity;
        existing.prices.push(Number(item.price));
        // Update product cost if this one is more recent or higher
        existing.productCost = Math.max(existing.productCost, productCost);
      } else {
        productMap.set(productId, {
          productId: item.product.id,
          productName: item.product.name,
          imageUrl: item.product.imageUrl || undefined,
          quantitySold: item.quantity,
          totalRevenue: Number(item.price) * item.quantity,
          prices: [Number(item.price)],
          productCost,
        });
      }
    }

    // Convert to array and calculate final metrics
    const allProducts = Array.from(productMap.values()).map((item) => {
      const avgPrice = item.totalRevenue / item.quantitySold;
      const profit = item.totalRevenue - item.productCost * item.quantitySold;

      return {
        productId: item.productId,
        productName: item.productName,
        imageUrl: item.imageUrl,
        quantitySold: item.quantitySold,
        price: avgPrice,
        productCost: item.productCost,
        revenue: item.totalRevenue,
        profit,
      };
    });

    // Sort by quantity sold (descending) and paginate
    const sortedProducts = allProducts.sort(
      (a, b) => b.quantitySold - a.quantitySold
    );
    const totalProducts = sortedProducts.length;
    const products = sortedProducts.slice(skip, skip + limit);
    const hasNextPage = skip + limit < totalProducts;

    return {
      products,
      totalProducts,
      page,
      limit,
      hasNextPage,
    };
  }

  private formatDateRange(startDate: string, endDate: string) {
    const start = new Date(startDate + "T00:00:00.000Z");
    const end = new Date(endDate + "T23:59:59.999Z");
    return { start, end };
  }

  async generateSoldProductsPdf(
    ownerId: string,
    startDate: string,
    endDate: string
  ): Promise<Buffer> {
    try {
      console.log("Starting PDF generation with PDFKit...");

      // Get all products without pagination for PDF
      const allProductsData = await this.getSoldProductsForPdf(
        ownerId,
        startDate,
        endDate
      );

      if (!allProductsData.products || allProductsData.products.length === 0) {
        throw new Error("Nenhum produto encontrado para o período selecionado");
      }

      // Generate PDF using PDFKit (no browser required)
      const pdfBuffer = await this.createPdfWithPDFKit(
        allProductsData,
        startDate,
        endDate
      );

      console.log("PDF generation completed successfully");
      return pdfBuffer;
    } catch (error) {
      console.error("Error generating PDF:", error);

      // Handle specific error types
      if (error.message?.includes("Nenhum produto encontrado")) {
        throw error;
      }

      // Generic error for unknown issues
      throw new Error(
        "Erro interno ao gerar o PDF. Tente novamente em alguns momentos."
      );
    }
  }

  private async createPdfWithPDFKit(
    data: {
      products: any[];
      summary: {
        totalProducts: number;
        totalRevenue: number;
        totalProfit: number;
        totalQuantitySold: number;
        startDate: string;
        endDate: string;
      };
    },
    startDate: string,
    endDate: string
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margin: 50,
          info: {
            Title: "Relatório de Produtos Vendidos",
            Author: "Sistema Arena Pro",
            Subject: `Produtos vendidos de ${this.formatDate(
              startDate
            )} a ${this.formatDate(endDate)}`,
            Creator: "Arena Pro System",
          },
        });

        const chunks: Buffer[] = [];

        // Collect PDF data
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });
        doc.on("error", (error) => reject(error));

        // Add content to PDF
        this.addPdfHeader(doc, startDate, endDate);
        this.addPdfSummary(doc, data.summary);
        this.addPdfProductsTable(doc, data.products);
        this.addPdfFooter(doc);

        // Finalize the PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private addPdfHeader(
    doc: PDFKit.PDFDocument,
    startDate: string,
    endDate: string
  ) {
    // Header
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("Relatório de Produtos Vendidos", 50, 50, { align: "center" });

    doc
      .fontSize(12)
      .font("Helvetica")
      .text(
        `Período: ${this.formatDate(startDate)} - ${this.formatDate(endDate)}`,
        50,
        80,
        { align: "center" }
      );

    // Add some space
    doc.moveDown(2);
  }

  private addPdfSummary(doc: PDFKit.PDFDocument, summary: any) {
    const startY = doc.y;

    // Summary box
    doc.rect(50, startY, 495, 80).fillAndStroke("#f8f9fa", "#dee2e6");

    // Summary content
    doc.fillColor("#000000").fontSize(10).font("Helvetica-Bold");

    // First row
    doc.text("Total de Produtos", 70, startY + 15);
    doc.text(summary.totalProducts.toString(), 70, startY + 30);

    doc.text("Qtd. Total Vendida", 200, startY + 15);
    doc.text(summary.totalQuantitySold.toString(), 200, startY + 30);

    doc.text("Receita Total", 330, startY + 15);
    doc.text(this.formatCurrency(summary.totalRevenue), 330, startY + 30);

    doc.text("Lucro Total", 460, startY + 15);
    doc
      .fillColor(summary.totalProfit >= 0 ? "#16a34a" : "#dc2626")
      .text(this.formatCurrency(summary.totalProfit), 460, startY + 30);

    doc.fillColor("#000000");
    doc.moveDown(3);
  }

  private addPdfProductsTable(doc: PDFKit.PDFDocument, products: any[]) {
    const tableTop = doc.y;
    const tableHeaders = [
      "Produto",
      "Qtd.",
      "Preço",
      "Custo",
      "Receita",
      "Lucro",
    ];
    const columnWidths = [180, 50, 60, 65, 70, 70];
    let currentX = 50;

    // Table header
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151");

    // Header background
    doc.rect(50, tableTop, 495, 25).fillAndStroke("#f3f4f6", "#e5e7eb");

    // Header text
    doc.fillColor("#000000");
    tableHeaders.forEach((header, i) => {
      doc.text(header, currentX + 5, tableTop + 8, {
        width: columnWidths[i] - 10,
        align: i === 0 ? "left" : "center",
      });
      currentX += columnWidths[i];
    });

    // Table rows
    let currentY = tableTop + 25;
    doc.fontSize(8).font("Helvetica");

    products.forEach((product, index) => {
      if (currentY > 700) {
        // Start new page if needed
        doc.addPage();
        currentY = 50;
      }

      // Alternate row colors
      if (index % 2 === 0) {
        doc.rect(50, currentY, 495, 20).fillAndStroke("#f9fafb", "#f3f4f6");
      }

      currentX = 50;
      const rowData = [
        product.productName.length > 25
          ? product.productName.substring(0, 25) + "..."
          : product.productName,
        product.quantitySold.toString(),
        this.formatCurrency(product.price),
        this.formatCurrency(product.productCost),
        this.formatCurrency(product.revenue),
        this.formatCurrency(product.profit),
      ];

      doc.fillColor("#000000");
      rowData.forEach((data, i) => {
        if (i === 5) {
          // Profit column
          doc.fillColor(product.profit >= 0 ? "#16a34a" : "#dc2626");
        }

        doc.text(data, currentX + 5, currentY + 6, {
          width: columnWidths[i] - 10,
          align: i === 0 ? "left" : "center",
        });

        currentX += columnWidths[i];

        if (i === 5) {
          doc.fillColor("#000000");
        }
      });

      currentY += 20;
    });
  }

  private addPdfFooter(doc: PDFKit.PDFDocument) {
    const now = new Date();
    const footerText = `Relatório gerado em ${now.toLocaleDateString(
      "pt-BR"
    )} às ${now.toLocaleTimeString("pt-BR")}`;

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#6b7280")
      .text(footerText, 50, doc.page.height - 50, { align: "center" });
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  private formatDate(dateStr: string): string {
    return dateStr.split("-").reverse().join("/");
  }

  private async getSoldProductsForPdf(
    ownerId: string,
    startDate: string,
    endDate: string
  ) {
    const dateRange = this.formatDateRange(startDate, endDate);

    // Get all order items without pagination
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          ownerId,
          status: "CLOSED",
        },
        product: {
          isNot: null,
        },
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      include: {
        product: {
          include: {
            stockProduct: {
              include: {
                stock: true,
              },
            },
          },
        },
      },
    });

    // Group and calculate metrics (same logic as getSoldProducts)
    const productMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        imageUrl?: string;
        quantitySold: number;
        totalRevenue: number;
        prices: number[];
        productCost: number;
      }
    >();

    for (const item of orderItems) {
      if (!item.product) continue;

      const productId = item.product.id;
      const existing = productMap.get(productId);

      // Calculate product cost from stock
      let productCost = 0;
      if (item.product.stockProduct && item.product.stockProduct.length > 0) {
        const stockItems = item.product.stockProduct;
        const totalQuantity = stockItems.reduce(
          (sum, sp) => sum + sp.quantity,
          0
        );
        const totalCost = stockItems.reduce(
          (sum, sp) => sum + sp.quantity * Number(sp.stock.unitPrice),
          0
        );
        productCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
      }

      if (existing) {
        existing.quantitySold += item.quantity;
        existing.totalRevenue += Number(item.price) * item.quantity;
        existing.prices.push(Number(item.price));
        existing.productCost = Math.max(existing.productCost, productCost);
      } else {
        productMap.set(productId, {
          productId: item.product.id,
          productName: item.product.name,
          imageUrl: item.product.imageUrl || undefined,
          quantitySold: item.quantity,
          totalRevenue: Number(item.price) * item.quantity,
          prices: [Number(item.price)],
          productCost,
        });
      }
    }

    // Convert to array and calculate final metrics
    const allProducts = Array.from(productMap.values()).map((item) => {
      const avgPrice = item.totalRevenue / item.quantitySold;
      const profit = item.totalRevenue - item.productCost * item.quantitySold;

      return {
        productId: item.productId,
        productName: item.productName,
        imageUrl: item.imageUrl,
        quantitySold: item.quantitySold,
        price: avgPrice,
        productCost: item.productCost,
        revenue: item.totalRevenue,
        profit,
      };
    });

    // Sort by quantity sold (descending)
    const sortedProducts = allProducts.sort(
      (a, b) => b.quantitySold - a.quantitySold
    );

    // Calculate summary
    const totalRevenue = sortedProducts.reduce((sum, p) => sum + p.revenue, 0);
    const totalProfit = sortedProducts.reduce((sum, p) => sum + p.profit, 0);
    const totalQuantitySold = sortedProducts.reduce(
      (sum, p) => sum + p.quantitySold,
      0
    );

    return {
      products: sortedProducts,
      summary: {
        totalProducts: sortedProducts.length,
        totalRevenue,
        totalProfit,
        totalQuantitySold,
        startDate,
        endDate,
      },
    };
  }

  private getDateRange(
    period: ReportPeriod,
    startDate?: string,
    endDate?: string
  ) {
    let end = endDate ? new Date(endDate) : new Date();
    let start: Date;

    if (startDate) {
      start = new Date(startDate);
    } else {
      switch (period) {
        case "today":
          start = new Date();
          start.setHours(0, 0, 0, 0);
          end = start;
          break;
        case "current":
          start = new Date();
          start.setDate(1); // Set to first day of current month
          start.setHours(0, 0, 0, 0);
          break;
        case "month":
          start = new Date();
          start.setMonth(start.getMonth() - 1);
          break;
        case "3months":
          start = new Date();
          start.setMonth(start.getMonth() - 3);
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          break;
        case "6months":
          start = new Date();
          start.setMonth(start.getMonth() - 6);
          break;
        case "year":
          start = new Date();
          start.setFullYear(start.getFullYear() - 1);
          break;
      }
    }
    start = new Date(start.toISOString().split("T")[0] + "T00:00:00.000Z");
    end = new Date(end.toISOString().split("T")[0] + "T23:59:59.999Z");
    console.log("DATAAA", { end, start });
    return { start, end };
  }

  private calculateMonthlyStats(
    payments: any[],
    dateRange: { start: Date; end: Date }
  ) {
    const monthlyData = new Map<
      string,
      { totalSales: number; orderIds: Set<string> }
    >();

    payments.forEach((payment) => {
      const month = new Date(payment.createdAt).toISOString().slice(0, 7); // YYYY-MM
      const existing = monthlyData.get(month) || {
        totalSales: 0,
        orderIds: new Set(),
      };

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
    const methodData = new Map<
      PaymentMethod,
      { totalAmount: number; orderIds: Set<string> }
    >();

    payments.forEach((payment) => {
      const existing = methodData.get(payment.method) || {
        totalAmount: 0,
        orderIds: new Set(),
      };
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

  private calculateDayOfWeekStats(
    payments: any[],
    dateRange: { start: Date; end: Date }
  ) {
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayData = new Map<
      number,
      { totalSales: number; orderIds: Set<string> }
    >();

    // Calculate day occurrences in the date range
    const dayOccurrences = this.calculateDayOccurrences(
      dateRange.start,
      dateRange.end
    );

    payments.forEach((payment) => {
      const dayOfWeek = new Date(payment.createdAt).getDay();
      const existing = dayData.get(dayOfWeek) || {
        totalSales: 0,
        orderIds: new Set(),
      };

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
    const productData = new Map<
      string,
      { imageUrl: string; name: string; totalSold: number; revenue: number }
    >();

    payments.forEach((payment) => {
      payment.order.items.forEach((item: any) => {
        if (!item.product) return;

        const productId = item.product.id;
        const existing = productData.get(productId) || {
          imageUrl: item.product.imageUrl,
          name: item.product.name,
          totalSold: 0,
          revenue: 0,
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
