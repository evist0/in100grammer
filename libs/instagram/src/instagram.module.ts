import { Logger, Module } from '@nestjs/common';
import { InstagramService } from './instagram.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SessionModule, SessionService } from '@app/session';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (session: SessionService, configService: ConfigService) => ({
        baseURL: 'https://i.instagram.com/api/v1',
        headers: {
          'User-Agent': configService.get('INSTAGRAM_USER_AGENT'),
        },
      }),
      imports: [SessionModule, ConfigModule],
      inject: [SessionService, ConfigService],
    }),
  ],
  providers: [InstagramService, { provide: Logger, useValue: new Logger(InstagramModule.name) }],
  exports: [InstagramService],
})
export class InstagramModule {}
