import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { USERS_QUEUE } from '@app/users-queue';
import { InstagramService } from '@app/instagram';
import { PrismaService } from '@app/prisma';

import { CountryDetector } from './common/country-detector';

@Injectable()
export class AppService {
  constructor(
    @Inject(USERS_QUEUE) private readonly usersQueue: ClientProxy,
    private readonly prisma: PrismaService,
    private readonly instagramService: InstagramService,
    private readonly countryDetector: CountryDetector,
    private readonly logger: Logger,
  ) {}

  async enqueue(id: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (existingUser) {
      this.logger.log(`User ${id} already exists`);
      return;
    }

    await this.prisma.user.create({ data: { id } });
    this.logger.log(`User ${id} queued`);

    try {
      const userInfo = await this.instagramService.getUserInfo(id);
      this.logger.log(`Got user info for ${id} — ${userInfo.username}`);

      const posts = await this.instagramService.getUserPosts(id);
      this.logger.log(`Got ${posts.length} posts for ${id}`);

      const { countryCode, countryReason } =
        await this.countryDetector.getCountry(userInfo);

      await this.prisma.userDetails.create({
        data: {
          id: userInfo.pk.toString(),
          username: userInfo.username,
          fullName: userInfo.full_name,
          description: userInfo.biography,
          followers: userInfo.follower_count,
          following: userInfo.following_count,
          postsAmount: userInfo.media_count,
          lastPost: new Date(posts[0].taken_at),
          phone: userInfo.contact_phone_number,
          email: userInfo.public_email,
          site: userInfo.external_url,
          potentiallyBusiness: userInfo.is_potential_business,
          business: userInfo.is_business,
          businessCategory: userInfo.category,
          countryCode,
          countryReason,
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
      this.logger.log(`Got ${newUsers.length} unique friendships`);

      newUsers.forEach((userId) => {
        const record = new RmqRecordBuilder(userId)
          .setOptions({
            headers: {
              ['x-deduplication-header']: userId,
            },
          })
          .build();

        this.usersQueue.send('enqueue', record).subscribe();
      });
    } catch (e) {
      await this.prisma.user.delete({ where: { id } });
      this.logger.log(`User processing failed. State reverted.`);
    }
  }
}
