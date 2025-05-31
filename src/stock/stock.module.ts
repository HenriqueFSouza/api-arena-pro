import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StockHistoryController } from './history/stock-history.controller';
import { StockHistoryService } from './history/stock-history.service';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

@Module({
    imports: [PrismaModule],
    controllers: [StockController, StockHistoryController],
    providers: [StockService, StockHistoryService],
})
export class StockModule { } 