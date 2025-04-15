import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Profile } from '@prisma/client';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe';
import {
  CreatePaymentDto,
  createPaymentSchema,
} from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) { }

  @Post(':orderId')
  async create(
    @CurrentUser() user: Profile,
    @Param('orderId') orderId: string,
    @Body(new ZodValidationPipe(createPaymentSchema))
    data: CreatePaymentDto,
  ) {
    return this.paymentsService.create(orderId, user.id, data);
  }

  @Get(':orderId')
  async findByOrder(
    @CurrentUser() user: Profile,
    @Param('orderId') orderId: string,
  ) {
    return this.paymentsService.findByOrder(orderId, user.id);
  }

  @Delete(':id')
  async cancel(
    @Param('id') id: string,
  ) {
    return this.paymentsService.delete(id);
  }
} 