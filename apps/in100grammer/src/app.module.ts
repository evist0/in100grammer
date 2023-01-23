import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { InstagramModule } from '@app/instagram';
import { PrismaModule } from '@app/prisma';
import { SessionModule } from '@app/session';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { DIRECT_EXCHANGE } from './app.consts';
import { NominatimModule } from './nominatim/nominatim.module';
import { CountryDetector } from './common/country-detector';

@Module({
  imports: [
    ConfigModule.forRoot(),
    SessionModule.forRoot(),
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const user = configService.get('RABBITMQ_USER');
        const password = configService.get('RABBITMQ_PASS');
        const host = configService.get('RABBITMQ_HOST');

        return {
          uri: `amqp://${user}:${password}@${host}`,
          enableControllerDiscovery: true,
          exchanges: [
            {
              name: DIRECT_EXCHANGE,
              type: 'direct',
            },
          ],
          channels: {
            default: {
              prefetchCount: 10,
              default: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    PrismaModule,
    InstagramModule,
    NominatimModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    CountryDetector,
    {
      provide: Logger,
      useValue: new Logger(AppModule.name),
    },
  ],
})
export class AppModule {}
