import { Controller, Logger, Param, Post, UseGuards } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { Throttle } from '@nestjs/throttler';

import { AppService } from './app.service';
import { RmqThrottlerGuard } from './common/rmq-throttler.guard';

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

  @UseGuards(RmqThrottlerGuard)
  @MessagePattern('enqueue')
  async rabbitEnqueue(@Payload() id: string, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    this.logger.log(`RMQ Enqueue "${id}"`);
    await this.appService.enqueue(id);

    // channel.ack(message);
  }
}
