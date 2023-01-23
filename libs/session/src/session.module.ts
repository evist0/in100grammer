import { DynamicModule, Global, Logger, Module } from '@nestjs/common';
import { PrismaModule, PrismaService } from '@app/prisma';
import * as fs from 'fs';

import { SessionService } from './session.service';
import { SESSION_OPTIONS } from './session.constants';
import { getIam, INITIAL_PROXY_FILE } from './helpers';

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
          useFactory: async (prisma: PrismaService) => {
            const iam = await getIam(prisma);

            // Ресурсы, которые необходимо освободить в main.ts в случае неудачной инициализации
            // apps/in100grammer/src/main.ts
            fs.writeFileSync(INITIAL_PROXY_FILE, JSON.stringify({ iam }), 'utf-8');

            return iam;
          },
        },
        SessionService,
      ],
      exports: [SessionService],
    };
  }
}
