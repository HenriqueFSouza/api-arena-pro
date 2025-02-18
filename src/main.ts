import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Env } from './env';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['content-type']
  });

  const configService = app.get<ConfigService<Env>>(ConfigService)

  const port = configService.get('PORT', { infer: true })

  app.use(cookieParser());

  await app.listen(port);
}
bootstrap();
