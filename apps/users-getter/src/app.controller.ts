import { Controller, Logger, Param, Post } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { Throttle } from '@nestjs/throttler';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: Logger,
  ) {}

  @Throttle(200, 60 * 60)
  @Post('enqueue/:id')
  enqueue(@Param('id') id: string) {
    this.logger.log(`HTTP Enqueue "${id}"`);
    return this.appService.enqueue(id);
  }

  // TODO: RMQ throttler
  @Throttle(200, 60 * 60)
  @EventPattern({ cmd: 'enqueue' })
  rabbitEnqueue(id: string) {
    this.logger.log(`RMQ Enqueue "${id}"`);
    return this.appService.enqueue(id);
  }
}
