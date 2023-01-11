import { Logger, Module } from '@nestjs/common';
import { UsersQueueModule } from '@app/users-queue';
import { InstagramModule } from '@app/instagram';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { PrismaModule } from '@app/prisma';

@Module({
  imports: [
    ConfigModule.forRoot(),
    UsersQueueModule,
    InstagramModule,
    PrismaModule,
    ThrottlerModule.forRoot({
      ttl: 60 * 60, // 1h,
      limit: 200, // 200 requests,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: Logger,
      useFactory: () => new Logger('UsersGetter'),
    },
  ],
})
export class AppModule {}
