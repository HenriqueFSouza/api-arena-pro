import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { Profile } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe';
import {
  CreatePaymentDto,
  createPaymentSchema,
} from './dto/create-payment.dto';

@Controller('orders/:orderId/payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  async create(
    @CurrentUser() user: Profile,
    @Param('orderId') orderId: string,
    @Body(new ZodValidationPipe(createPaymentSchema))
    data: CreatePaymentDto,
  ) {
    return this.paymentsService.create(orderId, user.id, data);
  }

  @Get()
  async findByOrder(
    @CurrentUser() user: Profile,
    @Param('orderId') orderId: string,
  ) {
    return this.paymentsService.findByOrder(orderId, user.id);
  }

  @Delete(':id')
  async cancel(
    @CurrentUser() user: Profile,
    @Param('orderId') orderId: string,
    @Param('id') id: string,
  ) {
    return this.paymentsService.cancel(id, orderId, user.id);
  }
} 