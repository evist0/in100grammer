import { Injectable } from '@nestjs/common';
import { SessionService } from '@app/session';
import { HttpService } from 'nestjs-http-promise';

import { GetCountryResult } from './types/get-country.result';

@Injectable()
export class NominatimService {
  constructor(private readonly httpClient: HttpService, private readonly sessionService: SessionService) {}

  async getCountry(lat: number, lon: number): Promise<GetCountryResult['address']> {
    const { data } = await this.httpClient.get<GetCountryResult>('reverse', {
      httpsAgent: this.sessionService.httpsAgent,
      params: { lat, lon, zoom: 3, format: 'jsonv2' },
    });

    return { ...data.address, country_code: data.address.country_code.toUpperCase() };
  }
}
