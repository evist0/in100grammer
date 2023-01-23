import { Injectable, Logger } from '@nestjs/common';
import { InstagramService } from '@app/instagram';
import { ConfigService } from '@nestjs/config';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { PrismaService } from '@app/prisma';
import { filter } from 'rxjs';

import { DIRECT_EXCHANGE, QUEUE_NAME } from './app.consts';
import { createUser } from './helpers';
import { CountryDetector } from './common/country-detector';

@Injectable()
export class AppService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly instagramService: InstagramService,
    private readonly countryDetector: CountryDetector,
    private readonly logger: Logger,
  ) {}

  enqueue(id: string) {
    this.amqpConnection.publish(DIRECT_EXCHANGE, QUEUE_NAME, id, {
      persistent: true,
      headers: {
        'x-deduplication-header': id,
      },
    });
  }

  async process(id: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (existingUser) {
      this.logger.log(`[${id}]: User already exists`);
      return;
    }

    const userInfo = await this.instagramService.getUserInfo(id);
    this.logger.log(`[${id}]: User information received`);

    const posts = await this.instagramService.getUserPosts(id);
    const lastPostTime = posts.length > 1 ? posts[0].taken_at * 1000 : undefined;
    this.logger.log(`[${id}]: User posts received`);

    const { countryCode, countryReason } = await this.countryDetector.getCountry(userInfo);
    this.logger.log(`[${id}]: Country — '${countryCode}', because ${countryReason}`);

    if (userInfo.follower_count < 10_000) {
      this.instagramService
        .getFollowers(id, userInfo.follower_count)
        .pipe(filter((f) => !f.is_private))
        .subscribe((follower) => this.enqueue(follower.pk.toString()));
    } else {
      this.logger.log(`[${id}]: Over 10,000 followers. Skipping`);
    }

    if (userInfo.following_count < 10_000) {
      this.instagramService
        .getFollowings(id, userInfo.follower_count)
        .pipe(filter((f) => !f.is_private))
        .subscribe((following) => this.enqueue(following.pk.toString()));
    } else {
      this.logger.log(`[${id}]: Over 10,000 following. Skipping`);
    }

    const user = createUser(userInfo, {
      lastPost: new Date(lastPostTime),
      countryCode,
      countryReason,
    });

    await this.prisma.user.create({
      data: user,
    });
  }
}
