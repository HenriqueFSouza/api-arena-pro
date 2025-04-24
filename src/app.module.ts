import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { envSchema } from './env';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductCategoriesModule } from './product-categories/product-categories.module';
import { ProductsModule } from './products/products.module';
import { ProfilesModule } from './profiles/profiles.module';
import { StorageModule } from './storage/storage.module';

const allowedOrigins = ['https://payarena.com.br/', 'https://www.payarena.com.br/', 'http://localhost:3000'];
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
              if (allowedOrigins.includes(origin)) {
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
