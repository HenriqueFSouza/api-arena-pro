import { Controller, Get, Query, Response, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Profile } from "@prisma/client";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ReportPeriod, ReportsService } from "./reports.service";

@ApiTags("reports")
@Controller("reports")
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("sales")
  @ApiOperation({ summary: "Get sales report with analytics data" })
  @ApiResponse({
    status: 200,
    description:
      "Sales report data including charts, payment methods, and product analytics",
  })
  async getSalesReport(
    @CurrentUser() user: Profile,
    @Query("period") period: ReportPeriod = "3months",
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.reportsService.getSalesReport(
      user.id,
      period,
      startDate,
      endDate
    );
  }

  @Get("sold-products")
  @ApiOperation({
    summary: "Get sold products report with pagination and cost analysis",
  })
  @ApiResponse({
    status: 200,
    description:
      "Sold products data with quantity, price, and cost information",
  })
  async getSoldProducts(
    @CurrentUser() user: Profile,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "20"
  ) {
    const pageNumber = Math.max(1, parseInt(page, 10));
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit, 10))); // Max 50 per page

    return this.reportsService.getSoldProducts(
      user.id,
      startDate,
      endDate,
      pageNumber,
      limitNumber
    );
  }

  @Get("sold-products/pdf")
  @ApiOperation({
    summary: "Generate PDF report of all sold products in date range",
  })
  @ApiResponse({
    status: 200,
    description: "PDF file download",
    content: {
      "application/pdf": {
        schema: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  async generateSoldProductsPdf(
    @CurrentUser() user: Profile,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Response() res: any
  ) {
    try {
      // Validate date parameters
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: "Parâmetros startDate e endDate são obrigatórios",
        });
      }

      // Validate date format
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return res.status(400).json({
          error: "Formato de data inválido. Use YYYY-MM-DD",
        });
      }

      if (startDateObj > endDateObj) {
        return res.status(400).json({
          error: "Data inicial não pode ser maior que data final",
        });
      }

      const pdfBuffer = await this.reportsService.generateSoldProductsPdf(
        user.id,
        startDate,
        endDate
      );

      const filename = `produtos-vendidos-${startDate}-${endDate}.pdf`;

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      });

      res.send(pdfBuffer);
    } catch (error) {
      console.error("PDF generation error:", error);

      // Send appropriate error response
      const statusCode = error.message.includes("Nenhum produto encontrado")
        ? 404
        : 500;
      const errorMessage = error.message.includes("Nenhum produto encontrado")
        ? error.message
        : "Erro interno do servidor ao gerar PDF";

      res.status(statusCode).json({
        error: errorMessage,
      });
    }
  }
}
