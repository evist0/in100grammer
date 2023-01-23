import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SessionService } from '@app/session';
import { concat, defer, EMPTY, firstValueFrom, from, map, mergeMap, Observable, retry, tap } from 'rxjs';
import { AxiosError } from 'axios';

import { FriendshipsResult, FriendshipUser } from './types/friendships.result';
import { InfoResult } from './types/info.result';
import { PostsResult } from './types/posts.result';
import { AccountError, PrivateAccountError, ProxyError } from './types/private-account.error';
import { HttpsProxyAgent } from 'https-proxy-agent';

@Injectable()
export class InstagramService {
  constructor(
    private readonly httpClient: HttpService,
    private readonly logger: Logger,
    private readonly sessionService: SessionService,
  ) {}

  private _errorHandler = (httpsAgent: HttpsProxyAgent, sessionId: string) => async (error) => {
    if (error instanceof AxiosError) {
      if (error.response.data.message === 'Not authorized to view user') {
        throw new PrivateAccountError();
      }

      if (error.response.data.message === 'Please wait a few minutes before you try again.') {
        throw new ProxyError(httpsAgent);
      }

      if (error.response.data.message === 'checkpoint_required') {
        throw new AccountError(sessionId);
      }
    }

    throw error;
  };

  private friendshipMethod(userId: string, expectedAmount: number, method: string) {
    const httpsAgent = this.sessionService.httpsAgent;
    const sessionId = this.sessionService.sessionId;

    const fetchPage = (offset = 0): Observable<FriendshipsResult> =>
      this.httpClient
        .get<FriendshipsResult>(`friendships/${userId}/${method}`, {
          httpsAgent: this.sessionService.httpsAgent,
          headers: {
            Cookie: `sessionid=${this.sessionService.sessionId}`,
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
            delay: this._errorHandler(httpsAgent, sessionId),
          }),
        );

    const getPage = (offset = 0) =>
      defer(() => fetchPage(offset)).pipe(
        mergeMap(({ users, page_size }) => {
          const hasNext = offset + page_size < expectedAmount;

          const items$ = from(users);
          const next$: Observable<FriendshipUser> = hasNext ? getPage(offset + page_size) : EMPTY;

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

  async getUserInfo(userId: string): Promise<InfoResult['user']> {
    const httpsAgent = this.sessionService.httpsAgent;
    const sessionId = this.sessionService.sessionId;

    const { data } = await firstValueFrom(
      this.httpClient
        .get<InfoResult>(`users/${userId}/info`, {
          httpsAgent,
          headers: {
            Cookie: `sessionid=${sessionId}`,
          },
        })
        .pipe(
          retry({
            delay: this._errorHandler(httpsAgent, sessionId),
          }),
        ),
    );

    return data.user;
  }

  async getUserPosts(userId: string) {
    const httpsAgent = this.sessionService.httpsAgent;
    const sessionId = this.sessionService.sessionId;

    const { data } = await firstValueFrom(
      this.httpClient
        .get<PostsResult>(`feed/user/${userId}`, {
          httpsAgent,
          headers: {
            Cookie: `sessionid=${sessionId}`,
          },
          params: {
            limit: 12,
          },
        })
        .pipe(
          retry({
            delay: this._errorHandler(httpsAgent, sessionId),
          }),
        ),
    );

    return data.items;
  }
}
