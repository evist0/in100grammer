import { InfoResult } from '@app/instagram/types/info.result';
import { Injectable } from '@nestjs/common';
import phone from 'phone';

import { NominatimService } from '../nominatim/nominatim.service';

@Injectable()
export class CountryDetector {
  constructor(private readonly nominatimService: NominatimService) {}

  async getCountry(userInfo: InfoResult['user']) {
    const accLat = userInfo.latitude;
    const accLon = userInfo.longitude;

    if (accLat && accLon) {
      const country = await this.nominatimService.getCountry(accLat, accLon);

      return { countryCode: country.country_code, countryReason: 'account' };
    }

    const contactPhone = userInfo.contact_phone_number;

    if (contactPhone) {
      const phoneData = phone(contactPhone);

      return { countryCode: phoneData.countryIso2, countryReason: 'phone' };
    }

    return { countryCode: undefined, countryReason: 'empty' };
  }
}
