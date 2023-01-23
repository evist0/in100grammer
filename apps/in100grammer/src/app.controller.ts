import { Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NoFreeResourcesError } from '@app/session';
import { defaultNackErrorHandler, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

import { AppService } from './app.service';
import { DIRECT_EXCHANGE, QUEUE_NAME } from './app.consts';
import { requeueErrorHandler } from '@golevelup/nestjs-rabbitmq/lib/amqp/errorBehaviors';

@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService,
    private readonly appService: AppService,
    private readonly logger: Logger,
  ) {}

  @Get('/')
  test() {
    return 'Hello world!';
  }

  @Post('enqueue/:id')
  enqueue(@Param('id') id: string) {
    this.logger.log(`[${id}]: HTTP Enqueue`);
    return this.appService.enqueue(id);
  }

  @RabbitSubscribe({
    routingKey: QUEUE_NAME,
    exchange: DIRECT_EXCHANGE,
    queue: QUEUE_NAME,
    createQueueIfNotExists: true,
    allowNonJsonMessages: true,
    queueOptions: {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      overflow: 'reject-publish',
      durable: true,
      maxLength: 5,
      arguments: {
        'x-message-deduplication': true,
      },
    },
    errorHandler: requeueErrorHandler,
  })
  async process(id: string) {
    this.logger.log(`[${id}]: Processing started`);

    try {
      await this.appService.process(id);

      this.logger.log(`[${id}]: Processing end`);
    } catch (e) {
      this.logger.error(e);

      if (e instanceof NoFreeResourcesError) {
        process.exit(1);
      }

      throw e;
    }
  }
}
