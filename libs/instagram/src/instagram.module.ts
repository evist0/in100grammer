import { Module } from '@nestjs/common';
import { InstagramService } from './instagram.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpsProxyAgent } from 'https-proxy-agent';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        baseURL: 'https://i.instagram.com/api/v1',
        httpsAgent: new HttpsProxyAgent(
          configService.get('INSTAGRAM_HTTP_PROXY'),
        ),
        headers: {
          'User-Agent': configService.get('INSTAGRAM_USER_AGENT'),
          Cookie: `sessionid=${configService.get('INSTAGRAM_SESSION_ID')}`,
        },
      }),
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
  ],
  providers: [InstagramService],
  exports: [InstagramService],
})
export class InstagramModule {}
