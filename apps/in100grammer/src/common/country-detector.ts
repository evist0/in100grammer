import { InfoResult } from '@app/instagram/types/info.result';
import { Injectable } from '@nestjs/common';
import phone from 'phone';

import { NominatimService } from '../nominatim/nominatim.service';
import { PostsResult } from '@app/instagram';

@Injectable()
export class CountryDetector {
  constructor(private readonly nominatimService: NominatimService) {}

  async getCountry(userInfo: InfoResult['user'], posts: PostsResult['items']) {
    const accLat = userInfo.latitude;
    const accLon = userInfo.longitude;

    if (accLat && accLon) {
      try {
        const country = await this.nominatimService.getCountry(accLat, accLon);
        return { countryCode: country.country_code, countryReason: 'account' };
      } catch (e) {}
    }

    const contactPhone = userInfo.contact_phone_number;

    if (contactPhone) {
      const phoneData = phone(contactPhone);

      return { countryCode: phoneData.countryIso2, countryReason: 'phone' };
    }

    const countryCodeToCount = new Map<string, number>();

    await Promise.all(
      posts.map(async (post) => {
        if (post.lat && post.lng) {
          try {
            const country = await this.nominatimService.getCountry(post.lat, post.lng);
            const current = countryCodeToCount.get(country.country_code) ?? 0;
            countryCodeToCount.set(country.country_code, current + 1);
          } catch (e) {}
        }
      }),
    );

    if (countryCodeToCount.size === 0) {
      return { countryCode: undefined, countryReason: 'empty' };
    }

    let result = undefined;
    let max = 0;
    countryCodeToCount.forEach((value, key) => {
      if (value > max) {
        max = value;
        result = key;
      }
    });

    return { countryCode: result, countryReason: 'posts' };
  }
}
