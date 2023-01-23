import { Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { HttpsProxyAgent } from 'hpagent';

import { SESSION_OPTIONS } from './session.constants';
import { getIam, markDead, release } from './helpers';
import { SessionOptions } from './types';

export class SessionService implements OnModuleDestroy {
  private _iam: string;

  private _sessionCookies: string;

  private _httpsAgent: HttpsProxyAgent;

  private set iam(value: string) {
    this._iam = value;

    const parts = value.split('|');

    this._sessionCookies = parts[3];
    this._httpsAgent = new HttpsProxyAgent({
      keepAlive: true,
      proxy: `http://${parts[4]}`,
    });
  }

  get httpsAgent(): HttpsProxyAgent {
    return this._httpsAgent;
  }

  get sessionCookies(): string {
    return this._sessionCookies;
  }

  constructor(
    @Inject(SESSION_OPTIONS) iam: SessionOptions,
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {
    this.iam = iam;
  }

  async changeSession() {
    this.logger.log(`Changing session`);

    await markDead(this._iam, this.prisma);

    this.iam = await getIam(this.prisma);
  }

  async onModuleDestroy() {
    await release(this._iam, this.prisma);
  }
}
