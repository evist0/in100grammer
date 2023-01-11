import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SessionModule, SessionService } from '@app/session';

import { NominatimService } from './nominatim.service';

@Module({
  imports: [
    SessionModule,
    HttpModule.registerAsync({
      imports: [SessionModule],
      useFactory: (session: SessionService) => ({
        baseURL: 'https://nominatim.openstreetmap.org/',
        httpsAgent: new HttpsProxyAgent(session.proxy),
      }),
      inject: [SessionService],
    }),
  ],
  providers: [NominatimService],
  exports: [NominatimService],
})
export class NominatimModule {}
