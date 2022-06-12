import { Principal } from '@dfinity/principal';
import { UnionWindowOpener, UnionWindowOpenerOptions } from './opener';
import { OpenerOptions } from './types';

export interface UnionWindowAuthorizerOptions extends UnionWindowOpenerOptions {}

export interface LoginProps {
  principal: Principal;
}

export type Proof = number[];

export interface AuthData {
  proof: Proof;
  union: string;
}

const STORAGE_KEY = 'union-data';
export class UnionWindowAuthorizer {
  protected options: UnionWindowAuthorizerOptions;
  protected opener: UnionWindowOpener;
  protected data: AuthData | null;

  constructor(opts: UnionWindowAuthorizerOptions) {
    this.data = this.restore();
    this.options = opts;
    this.opener = new UnionWindowOpener(opts);
  }

  get proof(): Proof | null {
    return this.data?.proof || null;
  }

  get union(): Principal | null {
    return checkPrincipal(this.data?.union);
  }

  isAuthorized = () => {
    // TODO check proof here (not async!)
    return !!this.data;
  };

  login = ({ principal }: LoginProps, opts?: OpenerOptions) => {
    return new Promise<Proof | null>((resolve, reject) => {
      const timeout = setTimeout(() => reject('Time is over'), 5 * 60 * 1000);

      this.opener.open({
        path: `/wallets/authorize`,
        payload: { principal },
        options: { after: 'close', ...opts },
        handleResponse: (data) => {
          if (timeout) {
            clearTimeout(timeout);
          }
          this.data = parseData(data);
          this.store();
          resolve(this.proof);
        },
      });
    });
  };

  logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    this.data = null;
  };

  private store = () => {
    if (!this.data) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  };

  private restore = () => {
    let data: any | null = null;
    try {
      data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parseData(data);
  };
}

const parseData = (data: any): AuthData | null => {
  if (
    !data ||
    !('proof' in data) ||
    !Array.isArray(data.proof) ||
    Number.isNaN(data.proof[0]) ||
    !('union' in data) ||
    typeof data.union !== 'string'
  ) {
    return null;
  }

  return { proof: data.proof, union: data.union };
};

const checkPrincipal = (canisterId: string | Principal | undefined): Principal | null => {
  let principal: Principal;

  try {
    principal = Principal.from(canisterId);
  } catch (e) {
    return null;
  }

  if (!principal._isPrincipal || principal.isAnonymous()) {
    return null;
  }

  return principal;
};
