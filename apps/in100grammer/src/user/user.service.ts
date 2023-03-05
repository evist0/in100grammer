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

  async users(params: IUsersQuery): Promise<[number, User[]]> {
    const {
      skip,
      take,
      cursor,
      business,
      orderBy,
      hasPhone,
      hasEmail,
      hasSite,
      country,
      hasCountry,
      followersMax,
      followersMin,
      filterUsername,
      filterFullName,
      filterSite,
      filterEmail,
      filterBusinessCategory,
    } = params;

    const filters = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      AND: [
        { countryCode: country === '' ? undefined : country },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        { business: business === 'true' ? true : undefined },
        {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          ...(hasPhone === 'true' && {
            NOT: [
              {
                phone: '',
              },
            ],
          }),
        },
        {
          ...(followersMax &&
            followersMin && {
              followers: {
                gte: Number(followersMin),
                lte: Number(followersMax),
              },
            }),
        },
        { ...(filterUsername && { username: { contains: filterUsername } }) },
        { ...(filterFullName && { fullName: { contains: filterFullName } }) },
        { ...(filterSite && { site: { contains: filterSite } }) },
        { ...(filterEmail && { email: { contains: filterEmail } }) },
        { ...(filterBusinessCategory && { businessCategory: { contains: filterBusinessCategory } }) },
        {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          ...(hasEmail === 'true' && {
            NOT: [
              {
                email: '',
              },
            ],
          }),
        },
        {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          ...(hasSite === 'true' && {
            NOT: [
              {
                site: '',
              },
            ],
          }),
        },
        {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          ...(hasCountry === 'true' && {
            NOT: [
              {
                countryCode: '',
              },
            ],
          }),
        },
      ],
    };
    return await this.prisma.$transaction([
      this.prisma.user.count({
        where: filters,
      }),
      this.prisma.user.findMany({
        skip: Number(skip),
        take: Number(take),
        cursor: cursor,
        where: filters,
        orderBy,
      }),
    ]);
  }
}
