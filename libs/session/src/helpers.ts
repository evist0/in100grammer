import { PrismaClient } from '@prisma/client';

export const INITIAL_PROXY_FILE = 'initial_proxy.json';

export class NoFreeResourcesError extends Error {
  constructor(props: string) {
    super(props);
  }
}

export async function getIam(prisma: PrismaClient): Promise<string> {
  const tryLock = async () => {
    let availableIam;
    try {
      availableIam = await prisma.session.findFirstOrThrow({
        where: { busy: false, dead: false },
      });
    } catch (e) {
      throw new NoFreeResourcesError('Not found available session');
    }

    const updated = await prisma.session.updateMany({
      where: { iam: availableIam.iam, busy: false },
      data: { busy: true },
    });

    return updated.count ? availableIam.iam : undefined;
  };

  let iam = undefined;
  while (iam === undefined) {
    iam = tryLock();
  }

  return iam;
}

export async function release(iam: string, prisma: PrismaClient) {
  await prisma.session.update({ where: { iam }, data: { busy: false } });
}

export async function markDead(iam: string, prisma: PrismaClient) {
  await prisma.session.update({ where: { iam }, data: { busy: false, dead: true } });
}
