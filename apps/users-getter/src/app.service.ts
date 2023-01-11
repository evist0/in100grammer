import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { USERS_QUEUE } from '@app/users-queue';
import { InstagramService } from '@app/instagram';
import { PrismaService } from '@app/prisma';

@Injectable()
export class AppService {
  constructor(
    @Inject(USERS_QUEUE) private readonly usersQueue: ClientProxy,
    private readonly prisma: PrismaService,
    private readonly instagramService: InstagramService,
    private readonly logger: Logger,
  ) {}

  async enqueue(id: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (existingUser) {
      this.logger.log(`User ${id} already in queue`);
      return;
    }

    await this.prisma.user.create({ data: { id } });
    this.logger.log(`User ${id} queued`);

    let userInfo;
    try {
      userInfo = await this.instagramService.getUserInfo(id);
      this.logger.log(`Got userInfo for ${id} — ${userInfo.username}`);
    } catch (e) {
      this.logger.log(`User info request failed. Reverting...`);

      await this.prisma.user.delete({ where: { id } });
      this.usersQueue.emit({ cmd: 'enqueue' }, id);

      throw e;
    }

    await this.prisma.userDetails.create({
      data: {
        id: userInfo.pk.toString(),
        username: userInfo.username,
        fullName: userInfo.full_name,
        description: userInfo.biography,
        followers: userInfo.follower_count,
        following: userInfo.following_count,
        postsAmount: userInfo.media_count,
        // TODO: lastPost
        lastPost: undefined,
        phone: userInfo.contact_phone_number,
        email: userInfo.public_email,
        // TODO: site
        site: undefined,
        business: userInfo.is_business,
        businessCategory: userInfo.category,
        // TODO: location
        countryCode: undefined,
        address: undefined,
        // TODO: goods
        haveGoods: false,
      },
    });

    const followers = await this.instagramService.getFollowers(
      id,
      userInfo.follower_count,
    );
    this.logger.log(`Got ${followers.length} followers`);

    const following = await this.instagramService.getFollowing(
      id,
      userInfo.following_count,
    );
    this.logger.log(`Got ${following.length} following`);

    const newUsers = [...new Set([...followers, ...following])];
    this.logger.log(`Got ${newUsers.length} new users`);

    newUsers.forEach((userId) => {
      this.usersQueue.emit({ cmd: 'enqueue' }, userId);
    });
  }
}
