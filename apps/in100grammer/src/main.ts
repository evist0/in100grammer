import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@app/prisma';
import { INITIAL_PROXY_FILE, release } from '@app/session';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, { abortOnError: false });

    const prismaService = app.get(PrismaService);
    prismaService.enableShutdownHooks(app);

    app.enableShutdownHooks();

    const configService = app.get(ConfigService);

    const port = configService.get('PORT');
    await app.listen(port ?? 3000);
  } catch (e) {
    fs.access(INITIAL_PROXY_FILE, async (err) => {
      if (err) {
        return;
      }

      const initialProxy = JSON.parse(fs.readFileSync(INITIAL_PROXY_FILE, 'utf-8'));

      const prisma = new PrismaClient();

      await release(initialProxy, prisma);
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
}

bootstrap();
