import { Controller, Logger, Param, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

import { AppService } from './app.service';
import { DIRECT_EXCHANGE, QUEUE_NAME } from './app.consts';
import { RmqThrottlerGuard } from './common/rmq-throttler.guard';
import { NoFreeResourcesError } from '@app/session';

@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService,
    private readonly appService: AppService,
    private readonly logger: Logger,
  ) {}

  @Throttle(200, 60 * 60)
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
      durable: true,
      bindQueueArguments: {
        'x-message-deduplication': true,
      },
    },
  })
  @UseGuards(RmqThrottlerGuard)
  async process(id: string) {
    this.logger.log(`[${id}]: Processing started`);

    try {
      await this.appService.process(id);
    } catch (e) {
      this.logger.error(e);

      if (e instanceof NoFreeResourcesError) {
        process.exit(1);
      }
    }
  }
}
