import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { SessionService } from '@app/session';

@Catch()
export class AllExceptionFilter extends BaseExceptionFilter {
  constructor(private readonly sessionService: SessionService) {
    super();
  }

  async catch(exception: unknown, host: ArgumentsHost) {
    super.catch(exception, host);

    await this.sessionService.onModuleDestroy();
  }
}
