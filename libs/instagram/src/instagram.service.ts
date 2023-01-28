import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SessionService } from '@app/session';
import { catchError, concat, defer, EMPTY, firstValueFrom, from, map, mergeMap, Observable, retry, tap } from 'rxjs';
import { AxiosError } from 'axios';

import { FriendshipsResult, FriendshipUser } from './types/friendships.result';
import { InfoResult } from './types/info.result';
import { PostsResult } from './types/posts.result';
import { AccountError, AccountNotFoundError, PrivateAccountError, ProxyError } from './types/errors';
import { HttpsProxyAgent } from 'https-proxy-agent';

@Injectable()
export class InstagramService {
  constructor(
    private readonly httpClient: HttpService,
    private readonly logger: Logger,
    private readonly sessionService: SessionService,
  ) {}

  private _errorHandler = (httpsAgent: HttpsProxyAgent, sessionId: string) => async (error) => {
    if (error instanceof AxiosError && error?.response?.data) {
      if (error.response.data.message === 'Not authorized to view user') {
        throw new PrivateAccountError();
      }

      if (error.response.status === 404) {
        throw new AccountNotFoundError();
      }

      if (
        error.response.data?.message === 'challenge_required' ||
        error.response.status === 401 ||
        error.response.status === 403
      ) {
        throw new AccountError(sessionId);
      }

      if (error.response.status === 429) {
        throw new ProxyError(httpsAgent);
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
          catchError(this._errorHandler(httpsAgent, sessionId)),
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
        .pipe(catchError(this._errorHandler(httpsAgent, sessionId))),
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
        .pipe(catchError(this._errorHandler(httpsAgent, sessionId))),
    );

    return data.items;
  }
}
