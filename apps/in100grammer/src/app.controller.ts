import { Controller, Logger, Param, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Nack, RabbitSubscribe, requeueErrorHandler } from '@golevelup/nestjs-rabbitmq';
import { AccountError, PrivateAccountError, ProxyError } from '@app/instagram';

import { AppService } from './app.service';
import { DIRECT_EXCHANGE, QUEUE_NAME } from './app.consts';
import { NoFreeResourcesError, SessionService } from '@app/session';

@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService,
    private readonly appService: AppService,
    private readonly sessionService: SessionService,
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      overflow: 'reject-publish',
      durable: true,
      maxLength: 10000,
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
    } catch (e) {
      this.logger.error(e.stack);

      if (e instanceof PrivateAccountError) {
        return;
      } else if (e instanceof ProxyError) {
        await this.sessionService.changeProxy(e.httpsAgent).catch(() => {
          this.logger.error('No free proxy');
          process.exit(1);
        });
      } else if (e instanceof AccountError) {
        await this.sessionService.changeSession(e.sessionId).catch(() => {
          this.logger.error('No free session');
          process.exit(1);
        });
      } else {
        this.logger.error(e);
      }

      return new Nack(true);
    }
  }
}
