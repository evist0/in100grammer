import { Module } from '@nestjs/common';
import { InstagramService } from './instagram.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SessionModule, SessionService } from '@app/session';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (session: SessionService, configService: ConfigService) => ({
        baseURL: 'https://i.instagram.com/api/v1',
        httpsAgent: new HttpsProxyAgent(session.proxy),
        headers: {
          'User-Agent': configService.get('INSTAGRAM_USER_AGENT'),
          Cookie: `sessionid=${session.sessionId}`,
        },
      }),
      imports: [SessionModule, ConfigModule],
      inject: [SessionService, ConfigService],
    }),
  ],
  providers: [InstagramService],
  exports: [InstagramService],
})
export class InstagramModule {}
