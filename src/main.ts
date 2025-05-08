import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { Request, Response } from 'express';
import { AppModule } from './app.module';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService)
  const corsConfig = configService.get('cors')
  app.enableCors(corsConfig);

  app.getHttpAdapter().get('/health', (req: Request, res: Response) => {
    res.send('OK');
  });

  const port = configService.get('PORT', { infer: true })

  app.use(cookieParser());

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();