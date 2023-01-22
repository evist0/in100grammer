import { Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { AxiosProxyConfig } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

import { SESSION_OPTIONS } from './session.constants';
import { get, markDead, release } from './helpers';
import { SessionOptions } from './types';

export class SessionService implements OnModuleDestroy {
  private _proxy: AxiosProxyConfig;

  private _sessionCookies: string;

  private _httpsAgent: HttpsProxyAgent;

  constructor(
    @Inject(SESSION_OPTIONS) private readonly options: SessionOptions,
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {
    this._proxy = options.proxy;
    this._sessionCookies = options.sessionCookies;

    this._httpsAgent = new HttpsProxyAgent(
      `${this._proxy.protocol}://${this._proxy.auth.username}:${this._proxy.auth.password}@${this._proxy.host}:${this._proxy.port}`,
    );
  }

  get httpsAgent(): HttpsProxyAgent {
    return this._httpsAgent;
  }

  get sessionCookies(): string {
    return this._sessionCookies;
  }

  async changeSession() {
    this.logger.log(`Changing session`);

    const currentResources = { proxy: this._proxy, sessionId: this._sessionCookies };

    await markDead(currentResources, this.prisma);

    const { proxy, sessionId } = await get(this.prisma);

    this._proxy = proxy;
    this._sessionCookies = sessionId;

    this._httpsAgent = new HttpsProxyAgent(
      `${this._proxy.protocol}://${this._proxy.auth.username}:${this._proxy.auth.password}@${this._proxy.host}:${this._proxy.port}`,
    );

    this.logger.log(`New proxy: ${proxy.host}`);
    this.logger.log(`New session: ${sessionId}`);
  }

  async onModuleDestroy() {
    await release({ proxy: this._proxy, iam: this._sessionCookies }, this.prisma);
  }
}
