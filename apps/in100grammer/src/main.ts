import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@app/prisma';
import { INITIAL_PROXY_FILE, release } from '@app/session';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PaginatedDto, UserEntity } from './user/user.entity';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, { abortOnError: false });

    const prismaService = app.get(PrismaService);
    prismaService.enableShutdownHooks(app);

    const config = new DocumentBuilder().setTitle('int100grammer').setVersion('1.0').build();
    const document = SwaggerModule.createDocument(app, config, {
      extraModels: [PaginatedDto, UserEntity],
    });
    SwaggerModule.setup('api', app, document);
    app.enableCors({ origin: ['http://localhost:2000', 'https://localhost:2000'], credentials: true });
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
