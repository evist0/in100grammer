import { ModuleMetadata, Type } from '@nestjs/common';
import { AxiosProxyConfig } from 'axios';

export interface SessionOptions {
  proxy?: AxiosProxyConfig;
  sessionId?: string;
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
