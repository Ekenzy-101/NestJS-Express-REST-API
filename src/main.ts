import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import jwt from 'express-jwt';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number | undefined>('PORT') || 5000;
  const origin = configService.get<string>('PORT');
  const secret = configService.get<string>('APP_ACCESS_SECRET')!;
  const cookieName = configService.get<string>('ACCESS_TOKEN_COOKIE_NAME')!;

  app.enableCors({ origin, credentials: true });
  app.use(cookieParser());
  app.use(
    jwt({
      algorithms: ['HS256'],
      secret,
      credentialsRequired: false,
      getToken: (req) => req.cookies[cookieName],
    }),
  );

  await app.listen(port);
}
bootstrap();
