import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

export const USERS_QUEUE = Symbol('USERS_QUEUE');

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: USERS_QUEUE,
      useFactory: (configService: ConfigService) => {
        const user = configService.get('RABBITMQ_USER');
        const password = configService.get('RABBITMQ_PASS');
        const host = configService.get('RABBITMQ_HOST');

        const queue = configService.get('RABBITMQ_USERS_QUEUE_NAME');

        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [`amqp://${user}:${password}@${host}`],
            queue,
            noAck: false,
            persistent: true,
            queueOptions: {
              durable: true,
              'x-message-deduplication': true,
            },
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [USERS_QUEUE],
})
export class UsersQueueModule {}
