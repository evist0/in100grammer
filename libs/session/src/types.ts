import { ModuleMetadata, Type } from '@nestjs/common/interfaces';
import { Proxy } from '@prisma/client';

export interface SessionOptions {
  proxy: Proxy;
  sessionId: string;
}

export interface SessionOptionsFactory {
  createSessionOptions(): Promise<SessionAsyncOptions> | SessionAsyncOptions;
}

export interface SessionAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<SessionOptionsFactory>;
  useClass?: Type<SessionOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<SessionOptions> | SessionOptions;
  inject?: any[];
}
