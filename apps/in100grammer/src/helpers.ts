import { User } from '@prisma/client';
import { InfoResult } from '@app/instagram';

type Enrichment = {
  lastPost: Date | null;
  countryCode: string | null;
  countryReason: string | null;
};

type UserData = Omit<User, keyof Enrichment>;

const userAdapter = (userInfo: InfoResult['user']): UserData => ({
  id: userInfo.pk.toString(),
  username: userInfo.username,
  fullName: userInfo.full_name,
  description: userInfo.biography,
  followers: userInfo.follower_count,
  following: userInfo.following_count,
  postsAmount: userInfo.media_count,
  phone: userInfo.contact_phone_number,
  email: userInfo.public_email,
  site: userInfo.external_url,
  potentiallyBusiness: userInfo.is_potential_business,
  business: userInfo.is_business,
  businessCategory: userInfo.category?.length > 0 ? userInfo.category : null,
});

export const createUser = (userInfo: InfoResult['user'], enrichment: Enrichment): User =>
  Object.assign({}, userAdapter(userInfo), enrichment);
