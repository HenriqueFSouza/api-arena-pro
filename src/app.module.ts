import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CashRegisterModule } from './cash-register/cash-register.module';
import { envSchema } from './env';
import { ExpensesModule } from './expenses/expenses.module';
import { DiscountsModule } from './orders/discounts/discounts.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './orders/payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductCategoriesModule } from './product-categories/product-categories.module';
import { ProductsModule } from './products/products.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ReportsModule } from './reports/reports.module';
import { StockModule } from './stock/stock.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
      load: [
        () => ({
          cors: {
            origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
              if (!origin) return callback(null, true);
              if (origin.endsWith('payarena.com.br') || origin.endsWith('localhost:3000')) {
                callback(null, true);
              } else {
                callback(new Error('Not allowed by CORS'));
              }
            },
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            credentials: true,
            allowedHeaders: ['content-type', 'Authorization', 'Accept']
          }
        })
      ]
    }),
    PrismaModule,
    AuthModule,
    OrdersModule,
    PaymentsModule,
    ProfilesModule,
    ProductCategoriesModule,
    ProductsModule,
    StorageModule,
    DiscountsModule,
    CashRegisterModule,
    ExpensesModule,
    ReportsModule,
    StockModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
