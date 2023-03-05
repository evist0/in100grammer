import { Controller, Get, Logger, Param, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Nack, RabbitSubscribe, requeueErrorHandler } from '@golevelup/nestjs-rabbitmq';
import { AccountError, AccountNotFoundError, PrivateAccountError, ProxyError } from '@app/instagram';

import { AppService } from './app.service';
import { DIRECT_EXCHANGE, QUEUE_NAME } from './app.consts';
import { SessionService } from '@app/session';
import { UserService } from './user/user.service';
import { ApiOkResponse, ApiQuery, getSchemaPath } from '@nestjs/swagger';
import { PaginatedDto, UserEntity } from './user/user.entity';
import { IUsersQuery, UsersQuery } from './user/helpers';

@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService,
    private readonly appService: AppService,
    private readonly sessionService: SessionService,
    private readonly userService: UserService,
    private readonly logger: Logger,
  ) {}

  @Get('users')
  @ApiQuery({ type: UsersQuery })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedDto) },
        {
          properties: {
            results: {
              type: 'array',
              items: { $ref: getSchemaPath(UserEntity) },
            },
          },
        },
      ],
    },
  })
  async getAllUsers(
    @Query()
    filters: IUsersQuery,
  ): Promise<PaginatedDto<UserEntity>> {
    const [total, data] = await this.userService.users(filters);
    return { total, results: data, limit: filters.take, offset: filters.skip };
  }

  @Throttle(200, 60 * 60)
  @Post('enqueue/:id')
  enqueue(@Param('id') id: string) {
    this.logger.log(`[${id}]: HTTP Enqueue`);

    return this.appService.enqueue(id);
  }

  @RabbitSubscribe({
    routingKey: QUEUE_NAME,
    exchange: DIRECT_EXCHANGE,
    queue: QUEUE_NAME,
    createQueueIfNotExists: true,
    allowNonJsonMessages: true,
    queueOptions: {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      overflow: 'reject-publish',
      durable: true,
      maxLength: 10000,
      arguments: {
        'x-message-deduplication': true,
      },
    },
    errorHandler: requeueErrorHandler,
  })
  async process(id: string) {
    this.logger.log(`[${id}]: Processing started`);

    try {
      await this.appService.process(id);
    } catch (e) {
      if (e instanceof PrivateAccountError || e instanceof AccountNotFoundError) {
        return;
      }

      if (e instanceof ProxyError) {
        await this.sessionService.changeProxy(e.httpsAgent).catch(() => {
          this.logger.error('No free proxy');
          process.exit(1);
        });
      } else if (e instanceof AccountError) {
        await this.sessionService.changeSession(e.sessionId).catch(() => {
          this.logger.error('No free session');
          process.exit(1);
        });
      } else {
        this.logger.error(e);
      }

      return new Nack(true);
    }
  }
}
