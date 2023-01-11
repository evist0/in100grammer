import { DynamicModule, Global, Module, Provider } from '@nestjs/common';

import { SessionAsyncOptions, SessionOptionsFactory } from './types';
import { SESSION_OPTIONS } from './session.constants';
import { SessionService } from './session.service';

@Global()
@Module({})
export class SessionModule {
  static forRootAsync(options: SessionAsyncOptions): DynamicModule {
    const providers = [...this.createAsyncProviders(options), SessionService];

    return {
      module: SessionModule,
      imports: options.imports ?? [],
      providers,
      exports: providers,
    };
  }

  private static createAsyncProviders(
    options: SessionAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: SessionAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: SESSION_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    return {
      provide: SESSION_OPTIONS,
      useFactory: async (optionsFactory: SessionOptionsFactory) =>
        await optionsFactory.createSessionOptions(),
      inject: [options.useExisting || options.useClass],
    };
  }
}
