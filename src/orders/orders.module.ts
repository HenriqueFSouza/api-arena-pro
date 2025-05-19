import { Module } from '@nestjs/common';
import { CashRegisterService } from 'src/cash-register/cash-register.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController],
  providers: [OrdersService, CashRegisterService],
  exports: [OrdersService],
})
export class OrdersModule { } 