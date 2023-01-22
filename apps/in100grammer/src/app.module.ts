import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InstagramModule } from '@app/instagram';
import { PrismaModule } from '@app/prisma';
import { SessionModule } from '@app/session';
import { RMQModule } from 'nestjs-rmq';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { DIRECT_EXCHANGE, QUEUE_NAME } from './app.consts';
import { NominatimModule } from './nominatim/nominatim.module';
import { CountryDetector } from './common/country-detector';

@Module({
  imports: [
    ConfigModule.forRoot(),
    SessionModule.forRoot(),
    RMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        exchangeName: DIRECT_EXCHANGE,
        connections: [
          {
            login: configService.get('RABBITMQ_USER'),
            password: configService.get('RABBITMQ_PASSWORD'),
            host: configService.get('RABBITMQ_HOST'),
          },
        ],
        queueName: QUEUE_NAME,
        isQueueDurable: true,
        queueOptions: {
          durable: true,
          bindQueueArguments: {
            'x-message-deduplication': true,
          },
        },
      }),
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
