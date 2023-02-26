import { Prisma } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export interface IUsersQuery {
  skip?: number;
  take?: number;
  cursor?: Prisma.UserWhereUniqueInput;
  where?: Prisma.UserWhereInput;
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
  where?: Prisma.UserWhereInput;
  @ApiProperty()
  orderBy?: Prisma.UserOrderByWithRelationInput;
}
