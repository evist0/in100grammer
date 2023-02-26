import { PrismaService } from '@app/prisma';
import { Injectable } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { IUsersQuery } from './helpers';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async user(userWhereUniqueInput: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async users(params: IUsersQuery): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip: Number(skip),
      take: Number(take),
      cursor: cursor,
      where,
      orderBy,
    });
  }
}
