import { Injectable, Logger } from '@nestjs/common';
import { NoFreeResourcesError, SessionService } from '@app/session';
import { concat, defer, EMPTY, firstValueFrom, from, map, mergeMap, Observable, retry, tap } from 'rxjs';
import { HttpService } from '@nestjs/axios';

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
      this.httpClient
        .get<FriendshipsResult>(`friendships/${userId}/${method}`, {
          httpsAgent: this.sessionService.httpsAgent,
          headers: {
            Cookie: this.sessionService.sessionCookies,
          },
          params: {
            count: 200,
            maxCount: offset,
          },
        })
        .pipe(
          map((res) => res.data),
          tap(() => this.logger.log(`[${userId}]: Processed ${offset}/${expectedAmount} ${method}`)),
          retry({
            delay: async (error) => this.handleError(userId, error),
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
    const { data } = await firstValueFrom(
      this.httpClient
        .get<InfoResult>(`users/${userId}/info`, {
          httpsAgent: this.sessionService.httpsAgent,
          headers: {
            Cookie: this.sessionService.sessionCookies,
          },
        })
        .pipe(
          retry({
            delay: async (error) => this.handleError(userId, error),
          }),
        ),
    );

    return data.user;
  }

  async getUserPosts(userId: string) {
    const { data } = await firstValueFrom(
      this.httpClient
        .get<PostsResult>(`feed/user/${userId}`, {
          httpsAgent: this.sessionService.httpsAgent,
          headers: {
            Cookie: this.sessionService.sessionCookies,
          },
          params: {
            limit: 12,
          },
        })
        .pipe(
          retry({
            delay: async (error) => this.handleError(userId, error),
          }),
        ),
    );

    return data.items;
  }

  private async handleError(userId: string, error: any) {
    if (error.isAxiosError) {
      this.logger.log(error.request._header);

      this.logger.error(`[${userId}]: Request error — ${error.message}`);
      this.logger.error(error.response.data);

      if (
        error.response.data.message === 'challenge_required' ||
        error.response.status === 401 ||
        error.response.status === 403
      ) {
        return this.sessionService.changeSession();
      }
    }

    if (error instanceof NoFreeResourcesError) {
      throw error;
    }

    this.logger.error(`Unknown error:`);
    this.logger.error(error);
  }
}
