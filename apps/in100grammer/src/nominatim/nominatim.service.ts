import { Injectable } from '@nestjs/common';
import { SessionService } from '@app/session';
import { catchError, firstValueFrom, map } from 'rxjs';
import { AxiosError } from 'axios';
import { HttpService } from '@nestjs/axios';

import { GetCountryResult } from './types/get-country.result';

@Injectable()
export class NominatimService {
  constructor(private readonly httpClient: HttpService, private readonly sessionService: SessionService) {}

  async getCountry(lat: number, lon: number) {
    const { data } = await firstValueFrom(
      this.httpClient
        .get<GetCountryResult>('reverse', {
          httpsAgent: this.sessionService.httpsAgent,
          params: { lat, lon, zoom: 3, format: 'jsonv2' },
        })
        .pipe(
          map((res) => {
            const result = Object.assign({}, res);

            result.data.address.country_code = res.data.address.country_code.toUpperCase();

            return result;
          }),
          catchError((e: AxiosError) => {
            throw e;
          }),
        ),
    );

    return data.address;
  }
}
