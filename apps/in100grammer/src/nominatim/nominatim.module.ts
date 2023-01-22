import { Module } from '@nestjs/common';
import { HttpModule } from 'nestjs-http-promise';
import { SessionModule } from '@app/session';

import { NominatimService } from './nominatim.service';

@Module({
  imports: [
    SessionModule,
    HttpModule.register({
      baseURL: 'https://nominatim.openstreetmap.org/',
    }),
  ],
  providers: [NominatimService],
  exports: [NominatimService],
})
export class NominatimModule {}
