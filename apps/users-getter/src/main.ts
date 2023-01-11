import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@app/prisma';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const user = configService.get('RABBITMQ_USER');
  const password = configService.get('RABBITMQ_PASS');
  const host = configService.get('RABBITMQ_HOST');
  const queueName = configService.get('RABBITMQ_USERS_QUEUE_NAME');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [`amqp://${user}:${password}@${host}`],
      queue: queueName,
      queueOptions: {
        durable: true,
      },
    },
  });

  const port = configService.get('PORT');

  await app.listen(port ?? 3000);
  await app.startAllMicroservices();

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);
}

bootstrap();
