import { Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { AxiosProxyConfig } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

import { SESSION_OPTIONS } from './session.constants';
import { get, markDead, release } from './helpers';
import { SessionOptions } from './types';

export class SessionService implements OnModuleDestroy {
  private _proxy: AxiosProxyConfig;

  private _sessionId: string;

  private _httpsAgent: HttpsProxyAgent;

  constructor(
    @Inject(SESSION_OPTIONS) private readonly options: SessionOptions,
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {
    this._proxy = options.proxy;
    this._sessionId = options.sessionId;

    this._httpsAgent = new HttpsProxyAgent(
      `${this._proxy.protocol}://${this._proxy.auth.username}:${this._proxy.auth.password}@${this._proxy.host}:${this._proxy.port}`,
    );
  }

  get httpsAgent(): HttpsProxyAgent {
    return this._httpsAgent;
  }

  get sessionId(): string {
    return this._sessionId;
  }

  async changeSession() {
    const currentResources = { proxy: this._proxy, sessionId: this._sessionId };

    await markDead(currentResources, this.prisma);
    await release({ proxy: currentResources.proxy }, this.prisma);
  }

  async onModuleDestroy() {
    await release({ proxy: this._proxy, sessionId: this._sessionId }, this.prisma);
  }
}
