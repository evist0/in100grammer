import { DynamicModule, Global, Logger, Module } from '@nestjs/common';
import { PrismaModule, PrismaService } from '@app/prisma';

import { SessionService } from './session.service';
import { SESSION_OPTIONS } from './session.constants';
import { get, INITIAL_PROXY_FILE } from './helpers';
import * as fs from 'fs';

@Global()
@Module({})
export class SessionModule {
  static forRoot(): DynamicModule {
    return {
      module: SessionModule,
      imports: [PrismaModule],
      providers: [
        {
          provide: Logger,
          useValue: new Logger(SessionModule.name),
        },
        {
          provide: SESSION_OPTIONS,
          inject: [PrismaService, Logger],
          useFactory: async (prisma: PrismaService, logger: Logger) => {
            const result = await get(prisma);

            logger.log(`Proxy: ${result.proxy.host}`);
            logger.log(`Session: ${result.sessionId}`);

            // Ресурсы, которые необходимо освободить в main.ts в случае неудачной инициализации
            fs.writeFileSync(INITIAL_PROXY_FILE, JSON.stringify(result), 'utf-8');

            return result;
          },
        },
        SessionService,
      ],
      exports: [SessionService],
    };
  }
}
