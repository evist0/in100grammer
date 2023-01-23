import { HttpsProxyAgent } from 'https-proxy-agent';

export class PrivateAccountError extends Error {
  constructor() {
    super('PrivateAccountError');
  }
}

export class ProxyError extends Error {
  constructor(public readonly httpsAgent: HttpsProxyAgent) {
    super('ProxyError');
  }
}

export class AccountError extends Error {
  constructor(public readonly sessionId: string) {
    super('AccountError');
  }
}
