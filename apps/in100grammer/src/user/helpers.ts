import { Prisma } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export interface IUsersQuery {
  skip?: number;
  take?: number;
  cursor?: Prisma.UserWhereUniqueInput;
  business?: boolean;
  hasPhone?: boolean;
  hasEmail?: boolean;
  hasSite?: boolean;
  country?: string | null;
  hasCountry?: boolean;
  followersMax?: string;
  followersMin?: string;
  filterUsername?: string;
  filterFullName?: string;
  filterSite?: string;
  filterEmail?: string;
  filterBusinessCategory?: string;
  orderBy?: Prisma.UserOrderByWithRelationInput;
}

export class UsersQuery implements IUsersQuery {
  @ApiProperty()
  skip?: number;
  @ApiProperty()
  take?: number;
  @ApiProperty()
  cursor?: Prisma.UserWhereUniqueInput;
  @ApiProperty()
  business?: boolean;
  @ApiProperty()
  hasPhone?: boolean;
  @ApiProperty()
  hasEmail?: boolean;
  @ApiProperty()
  hasSite?: boolean;
  @ApiProperty()
  country?: string | null;
  @ApiProperty()
  hasCountry?: boolean;
  @ApiProperty()
  followersMax?: string;
  @ApiProperty()
  followersMin?: string;
  @ApiProperty({ required: false })
  filterUsername?: string;
  @ApiProperty({ required: false })
  filterFullName?: string;
  @ApiProperty({ required: false })
  filterSite?: string;
  @ApiProperty({ required: false })
  filterEmail?: string;
  @ApiProperty({ required: false })
  filterBusinessCategory?: string;
  @ApiProperty()
  orderBy?: Prisma.UserOrderByWithRelationInput;
}
