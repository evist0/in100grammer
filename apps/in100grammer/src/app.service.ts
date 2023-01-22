import { Injectable, Logger } from '@nestjs/common';
import { InstagramService } from '@app/instagram';
import { PrismaService } from '@app/prisma';
import { ConfigService } from '@nestjs/config';
import { RMQService } from 'nestjs-rmq';

import { QUEUE_NAME } from './app.consts';
import { CountryDetector } from './common/country-detector';

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class AppService {
  constructor(
    private readonly rmqService: RMQService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly instagramService: InstagramService,
    private readonly countryDetector: CountryDetector,
    private readonly logger: Logger,
  ) {}

  enqueue(id: string) {
    this.rmqService.notify<string>(QUEUE_NAME, id, {
      persistent: true,
      headers: {
        'x-deduplication-header': id,
      },
    });
  }

  async process(id: string) {
    await timeout(50000);
  }
}
