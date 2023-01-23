import { ModuleMetadata, Type } from '@nestjs/common';

export type SessionOptions = string;

export interface SessionOptionsFactory {
  createSessionOptions(): Promise<SessionAsyncOptions> | SessionAsyncOptions;
}

export interface SessionAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<SessionOptionsFactory>;
  useClass?: Type<SessionOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<SessionOptions> | SessionOptions;
  inject?: any[];
}
