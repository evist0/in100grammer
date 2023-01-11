import { Inject, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Proxy } from '@prisma/client';
import { PrismaService } from '@app/prisma';

import { SessionOptions } from './types';
import { SESSION_OPTIONS } from './session.constants';

export class SessionService implements OnModuleInit, OnModuleDestroy {
  private readonly _proxy: Proxy;
  private readonly _sessionId: string;

  private logger = new Logger(SessionService.name);

  constructor(
    @Inject(SESSION_OPTIONS) { proxy, sessionId }: SessionOptions,
    private readonly prisma: PrismaService,
  ) {
    this._proxy = proxy;
    this._sessionId = sessionId;

    console.log(this._proxy);
  }

  async onModuleInit(): Promise<void> {
    await this.prisma.proxy.update({
      where: { host: this._proxy.host },
      data: { busy: true },
    });

    await this.prisma.session.update({
      where: { id: this._sessionId },
      data: { busy: true },
    });
  }

  get proxy(): string {
    const { login, password, host, port } = this._proxy;
    return `http://${login}:${password}@${host}:${port}`;
  }

  get sessionId(): string {
    return this._sessionId;
  }

  async onModuleDestroy() {
    await this.prisma.proxy.update({
      where: { host: this._proxy.host },
      data: { busy: false },
    });

    await this.prisma.session.update({
      where: { id: this._sessionId },
      data: { busy: false },
    });
  }
}
