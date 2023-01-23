import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@app/prisma';
import { INITIAL_PROXY_FILE, release, SessionService } from '@app/session';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

import { AppModule } from './app.module';
import { AllExceptionFilter } from './common/exception.filter';
import { INestApplication } from '@nestjs/common';

async function bootstrap() {
  let app: INestApplication;

  try {
    app = await NestFactory.create(AppModule, { abortOnError: false });
  } catch (e) {
    fs.access(INITIAL_PROXY_FILE, async (err) => {
      if (err) {
        return;
      }

      const { iam } = JSON.parse(fs.readFileSync(INITIAL_PROXY_FILE, 'utf-8'));

      const prisma = new PrismaClient();

      await release(iam, prisma);
    });

    throw e;
  } finally {
    fs.access(INITIAL_PROXY_FILE, (err) => {
      if (err) {
        return;
      }

      fs.unlinkSync(INITIAL_PROXY_FILE);
    });
  }

  const sessionService = app.get(SessionService);
  app.useGlobalFilters(new AllExceptionFilter(sessionService));

  const prismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);

  app.enableShutdownHooks();

  const configService = app.get(ConfigService);

  const port = configService.get('PORT');
  await app.listen(port ?? 3000);
}

bootstrap();
