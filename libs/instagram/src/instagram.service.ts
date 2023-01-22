import { Injectable, Logger } from '@nestjs/common';
import { NoFreeResourcesError, SessionService } from '@app/session';
import { HttpService } from 'nestjs-http-promise';
import { concat, defer, EMPTY, from, map, mergeMap, Observable, retry, tap } from 'rxjs';

import { FriendshipsResult, FriendshipUser } from './types/friendships.result';
import { InfoResult } from './types/info.result';
import { PostsResult } from './types/posts.result';

@Injectable()
export class InstagramService {
  constructor(
    private readonly httpClient: HttpService,
    private readonly logger: Logger,
    private readonly sessionService: SessionService,
  ) {}

  private friendshipMethod(userId: string, expectedAmount: number, method: string) {
    const fetchPage = (offset = 0): Observable<FriendshipsResult> =>
      from(
        this.httpClient.get<FriendshipsResult>(`friendships/${userId}/${method}`, {
          httpsAgent: this.sessionService.httpsAgent,
          headers: {
            Cookie: `sessionid=${this.sessionService.sessionCookies}`,
          },
          params: {
            count: 200,
            maxCount: offset,
          },
        }),
      ).pipe(
        map((res) => res.data),
        tap(() => this.logger.log(`[${userId}]: Processed ${offset}/${expectedAmount} ${method}`)),
        retry({
          delay: async (error) => {
            if (error.isAxiosError) {
              this.logger.error(`[${userId}]: Request error — ${error.message}`);
              this.logger.error(error.response.data);

              if (error.response.data.message === 'checkpoint_required') {
                await this.sessionService.changeSession();
              }
            }

            if (error instanceof NoFreeResourcesError) {
              throw error;
            }

            this.logger.error(`Unknown error:`);
            this.logger.error(error);
          },
        }),
      );

    const getPage = (offset = 0) =>
      defer(() => fetchPage(offset)).pipe(
        mergeMap(({ users, page_size }) => {
          const hasNext = offset + page_size < expectedAmount;

          const items$ = from(users);
          const next$: Observable<FriendshipUser> = hasNext ? from(getPage(offset + page_size)) : EMPTY;

          return concat(items$, next$);
        }),
      );

    return getPage(0);
  }

  getFollowers(userId: string, followersAmount: number): Observable<FriendshipUser> {
    return this.friendshipMethod(userId, followersAmount, 'followers');
  }

  getFollowings(userId: string, followingAmount: number): Observable<FriendshipUser> {
    return this.friendshipMethod(userId, followingAmount, 'following');
  }

  async getUserInfo(userId: string) {
    const tryGetUserInfo = async () => {
      const { data } = await this.httpClient.get<InfoResult>(`users/${userId}/info`, {
        httpsAgent: this.sessionService.httpsAgent,
        headers: {
          Cookie: `sessionid=${this.sessionService.sessionCookies}`,
        },
      });

      return data;
    };

    let result: InfoResult;
    while (result === undefined) {
      result = await tryGetUserInfo();
    }

    return result.user;
  }

  async getUserPosts(userId: string) {
    const tryGetPosts = async () => {
      const { data } = await this.httpClient.get<PostsResult>(`feed/user/${userId}`, {
        httpsAgent: this.sessionService.httpsAgent,
        headers: {
          Cookie: `sessionid=${this.sessionService.sessionCookies}`,
        },
        params: {
          limit: 12,
        },
      });

      return data;
    };

    let result: PostsResult;
    while (result === undefined) {
      result = await tryGetPosts();
    }

    return result.items;
  }
}
