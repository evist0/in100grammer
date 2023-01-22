import { PrismaClient, Proxy } from '@prisma/client';
import { AxiosProxyConfig } from 'axios';

export const INITIAL_PROXY_FILE = 'initial_proxy.json';

export class NoFreeResourcesError extends Error {
  constructor(props: string) {
    super(props);
  }
}

export const proxyAdapter = (databaseProxy: Proxy): AxiosProxyConfig => ({
  protocol: 'http',
  host: databaseProxy.host,
  port: parseInt(databaseProxy.port, 10),
  auth: {
    username: databaseProxy.login,
    password: databaseProxy.password,
  },
});

export async function get(prisma: PrismaClient) {
  let proxy: AxiosProxyConfig;
  let iam: string;

  try {
    proxy = await getProxy(prisma);
    iam = await getIam(prisma);

    return { proxy, iam };
  } catch (e) {
    await release({ proxy, iam }, prisma);
    throw e;
  }
}

export async function getProxy(prisma: PrismaClient) {
  const tryLock = async () => {
    let availableProxy: Proxy;
    try {
      availableProxy = await prisma.proxy.findFirstOrThrow({
        where: { busy: false, dead: false },
      });
    } catch (e) {
      throw new NoFreeResourcesError('Not found available proxy');
    }

    const updated = await prisma.proxy.updateMany({
      where: { host: availableProxy.host, busy: false },
      data: { busy: true },
    });

    return updated.count ? proxyAdapter(availableProxy) : undefined;
  };

  let proxy = undefined;
  while (proxy === undefined) {
    proxy = tryLock();
  }

  return proxy;
}

export async function getIam(prisma: PrismaClient) {
  const tryLock = async () => {
    let availableIam;
    try {
      availableIam = await prisma.accounts.findFirstOrThrow({
        where: { busy: false, dead: false },
      });
    } catch (e) {
      throw new NoFreeResourcesError('Not found available account');
    }

    const updated = await prisma.accounts.updateMany({
      where: { iam: availableIam.iam, busy: false },
      data: { busy: true },
    });

    return updated.count ? availableIam.id : undefined;
  };

  let iam = undefined;
  while (iam === undefined) {
    iam = tryLock();
  }

  return iam;
}

export async function release(resources: { proxy?: AxiosProxyConfig; iam?: string }, prisma: PrismaClient) {
  if (resources.proxy) {
    await prisma.proxy.update({ where: { host: resources.proxy.host }, data: { busy: false } });
  }

  if (resources.iam) {
    await prisma.accounts.update({ where: { iam: resources.iam }, data: { busy: false } });
  }
}

export async function markDead(resources: { proxy?: AxiosProxyConfig; iam?: string }, prisma: PrismaClient) {
  if (resources.proxy) {
    await prisma.proxy.update({
      where: { host: resources.proxy.host },
      data: { busy: false, dead: true },
    });
  }

  if (resources.iam) {
    await prisma.accounts.update({
      where: { iam: resources.iam },
      data: { busy: false, dead: true },
    });
  }
}
