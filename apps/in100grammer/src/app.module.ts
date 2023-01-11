import { Logger, Module } from '@nestjs/common';
import { UsersQueueModule } from '@app/users-queue';
import { InstagramModule } from '@app/instagram';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule, PrismaService } from '@app/prisma';
import { SessionModule } from '@app/session';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { NominatimModule } from './nominatim/nominatim.module';
import { CountryDetector } from './common/country-detector';

@Module({
  imports: [
    PrismaModule,
    SessionModule.forRootAsync({
      imports: [PrismaModule],
      inject: [PrismaService],
      useFactory: async (prisma: PrismaService) => {
        const proxy = await prisma.proxy.findFirstOrThrow({
          where: { busy: false },
        });

        const session = await prisma.session.findFirstOrThrow({
          where: { busy: false },
        });

        return { proxy, sessionId: session.id };
      },
    }),
    ConfigModule.forRoot(),
    UsersQueueModule,
    InstagramModule,
    ThrottlerModule.forRoot({
      ttl: 60 * 60, // 1h,
      limit: 200, // 200 requests,
    }),
    NominatimModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    CountryDetector,
    {
      provide: Logger,
      useFactory: () => new Logger('UsersGetter'),
    },
  ],
})
export class AppModule {}
