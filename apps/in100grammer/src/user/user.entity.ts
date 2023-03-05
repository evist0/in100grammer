import { User } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UserEntity implements User {
  @ApiProperty()
  id: string;
  @ApiProperty()
  username: string;
  @ApiProperty()
  fullName: string;
  @ApiProperty()
  description: string;
  @ApiProperty()
  followers: number;
  @ApiProperty()
  following: number;
  @ApiProperty()
  postsAmount: number;
  @ApiProperty()
  lastPost: Date;
  @ApiProperty()
  phone: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  site: string;
  @ApiProperty()
  potentiallyBusiness: boolean;
  @ApiProperty()
  business: boolean;
  @ApiProperty()
  businessCategory: string;
  @ApiProperty()
  countryCode: string;
  @ApiProperty()
  countryReason: string;
}
export class PaginatedDto<TData> {
  @ApiProperty()
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;

  results: TData[];
}
