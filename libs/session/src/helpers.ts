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
  let sessionId: string;

  try {
    proxy = await getProxy(prisma);
    sessionId = await getSession(prisma);

    return { proxy, sessionId };
  } catch (e) {
    await release({ proxy, sessionId }, prisma);
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

export async function getSession(prisma: PrismaClient) {
  const tryLock = async () => {
    let availableSession;
    try {
      availableSession = await prisma.session.findFirstOrThrow({
        where: { busy: false, dead: false },
      });
    } catch (e) {
      throw new NoFreeResourcesError('Not found available session');
    }

    const updated = await prisma.session.updateMany({
      where: { id: availableSession.id, busy: false },
      data: { busy: true },
    });

    return updated.count ? availableSession.id : undefined;
  };

  let sesion = undefined;
  while (sesion === undefined) {
    sesion = tryLock();
  }

  return sesion;
}

export async function release(resources: { proxy?: AxiosProxyConfig; sessionId?: string }, prisma: PrismaClient) {
  if (resources.proxy) {
    await prisma.proxy.update({ where: { host: resources.proxy.host }, data: { busy: false } });
  }

  if (resources.sessionId) {
    await prisma.session.update({ where: { id: resources.sessionId }, data: { busy: false } });
  }
}

export async function markDead(resources: { proxy?: AxiosProxyConfig; sessionId?: string }, prisma: PrismaClient) {
  if (resources.proxy) {
    await prisma.proxy.update({
      where: { host: resources.proxy.host },
      data: { busy: false, dead: true },
    });
  }

  if (resources.sessionId) {
    await prisma.session.update({
      where: { id: resources.sessionId },
      data: { busy: false, dead: true },
    });
  }
}
