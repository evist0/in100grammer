import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

import { FriendshipsResult } from './types/friendships.result';
import { InfoResult } from './types/info.result';

@Injectable()
export class InstagramService {
  constructor(private readonly httpClient: HttpService) {}

  private async friendshipMethod(
    userId: string,
    expectedAmount: number,
    method: string,
  ) {
    const result: string[] = [];

    let currentOffset = 0;

    // У инстаграма бага в АПИ - флаг has_more не работает. Так что идём пагинацию руками по 200, пока не пройдём всю
    // TODO: возможно, есть элегантное решение через потоки
    while (currentOffset < expectedAmount) {
      const response = await firstValueFrom(
        this.httpClient.get<FriendshipsResult>(
          `friendships/${userId}/${method}`,
          {
            params: {
              count: 200,
              maxCount: currentOffset,
            },
          },
        ),
      );

      result.push(
        ...response.data.users
          .filter((u) => !u.is_private)
          .map((u) => u.pk.toString()),
      );

      currentOffset = currentOffset + response.data.page_size;
    }

    return result;
  }

  async getFollowers(
    userId: string,
    followersAmount: number,
  ): Promise<string[]> {
    return this.friendshipMethod(userId, followersAmount, 'followers');
  }

  async getFollowing(
    userId: string,
    followingAmount: number,
  ): Promise<string[]> {
    return this.friendshipMethod(userId, followingAmount, 'following');
  }

  async getUserInfo(userId: string) {
    const { data } = await firstValueFrom(
      this.httpClient.get<InfoResult>(`users/${userId}/info`).pipe(
        catchError((e: AxiosError) => {
          console.log(e.response);
          throw e;
        }),
      ),
    );

    return data.user;
  }
}
