import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { Env } from './env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['https://payarena.com.br', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['content-type', 'Authorization', 'Accept']
  });

  const configService = app.get<ConfigService<Env>>(ConfigService)

  const port = configService.get('PORT', { infer: true })

  app.use(cookieParser());

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();