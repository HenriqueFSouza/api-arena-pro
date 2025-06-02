import { Module } from '@nestjs/common';
import { CashRegisterService } from 'src/cash-register/cash-register.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StockHistoryService } from 'src/stock/history/stock-history.service';
import { StockService } from 'src/stock/stock.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
@Module({
  imports: [PrismaModule],
  controllers: [OrdersController],
  providers: [OrdersService, CashRegisterService, StockService, StockHistoryService],
  exports: [OrdersService],
})
export class OrdersModule { } 