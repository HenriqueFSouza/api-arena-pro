import { Module } from '@nestjs/common';
import { CashRegisterService } from 'src/cash-register/cash-register.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, CashRegisterService],
  exports: [PaymentsService],
})
export class PaymentsModule { } 