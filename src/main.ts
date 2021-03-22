import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number | undefined>('PORT') || 5000;
  const origin = configService.get<string>('PORT');
  app.enableCors({ origin, credentials: true });

  await app.listen(port);
}
bootstrap();
