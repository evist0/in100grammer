import { Controller, Logger, Param, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NoFreeResourcesError } from '@app/session';
import { RMQRoute } from 'nestjs-rmq';

import { AppService } from './app.service';
import { QUEUE_NAME } from './app.consts';

@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService,
    private readonly appService: AppService,
    private readonly logger: Logger,
  ) {}

  @Post('enqueue/:id')
  enqueue(@Param('id') id: string) {
    this.logger.log(`[${id}]: HTTP Enqueue`);

    return this.appService.enqueue(id);
  }

  @RMQRoute(QUEUE_NAME)
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
    }
  }
}
