import { Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { AxiosProxyConfig } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

import { SESSION_OPTIONS } from './session.constants';
import { getProxy, getSession, release } from './helpers';
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
    this.proxy = options.proxy;
    this._sessionId = options.sessionId;
  }

  private set proxy(value: AxiosProxyConfig) {
    this._proxy = value;

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

  async changeSession(sessionId: string) {
    // Возможно долетела ошибка уже после того как поменяли.
    if (sessionId !== this._sessionId) {
      return;
    }

    // Помечаем как мёртвую
    await this.prisma.session.update({
      where: {
        id: this._sessionId,
      },
      data: {
        busy: false,
        dead: true,
      },
    });

    // Получаем новую
    this._sessionId = await getSession(this.prisma);
  }

  async changeProxy(httpsAgent: HttpsProxyAgent) {
    // Возможно долетела ошибка уже после того как поменяли.
    // 'proxy' есть в объекте httpsAgent, но в типах не указано..

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (httpsAgent.proxy.host !== this._proxy.host) {
      return;
    }

    // Помечаем как мёртвую
    await this.prisma.proxy.update({
      where: {
        host: this._proxy.host,
      },
      data: {
        busy: false,
        dead: true,
      },
    });

    // Получаем новую
    this.proxy = await getProxy(this.prisma);
  }

  async onModuleDestroy() {
    await release({ proxy: this._proxy, sessionId: this._sessionId }, this.prisma);
  }
}
