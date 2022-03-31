import { Identity } from '@dfinity/agent';
import * as React from 'react';
import { authClient as authenticationClient, AuthClientWrapper } from 'toolkit';

const { createContext, useContext, useEffect, useState } = React;

export interface AuthContext {
  isAuthentificated: boolean;
  isAuthReady: AuthReadyState;
  authClient: AuthClientWrapper;
  identity: Identity | undefined;
  login: (mnemonic: string) => Promise<void>;
  logout: () => Promise<void>;
}

export enum AuthReadyState {
  NOT_READY,
  CREATED,
  READY,
}

export function useProvideAuth(authClient: typeof authenticationClient): AuthContext {
  const [isAuthentificatedLocal, setIsAuthenticatedLocal] = useState<boolean>(false);
  const [identity, setIdentity] = useState<Identity | undefined>();
  const [isAuthClientReady, setAuthClientReady] = useState<AuthReadyState>(
    AuthReadyState.NOT_READY,
  );

  // Creating the auth client is async and no auth related checks can happen
  // until it's ready so we set a state variable to keep track of it
  if (!authClient.ready) {
    authClient.create().then(async () => {
      setAuthClientReady(AuthReadyState.CREATED);
    });
  }

  // are authenticated, then set them to be fully logged in.
  useEffect(() => {
    if (!authClient.ready) return;
    Promise.all([authClient.getIdentity(), authClient.isAuthentificated()]).then(
      ([identity, isAuthentificated]) => {
        setIdentity(identity);
        setIsAuthenticatedLocal(isAuthentificated || false);
        setAuthClientReady(AuthReadyState.READY);
      },
    );
  }, [isAuthClientReady]);

  useEffect(() => {
    if (!authClient.ready) return;
    (async () => {
      const identity = await authClient.getIdentity();

      if (identity && !identity.getPrincipal().isAnonymous()) {
        setIdentity(identity);
      }
    })();
  }, []);

  const isAuthentificated = isAuthentificatedLocal;

  const login = async (mnemonic: string): Promise<void> => {
    if (!authClient) {
      return;
    }
    let identity = await authClient.getIdentity();

    await authClient.login(mnemonic);

    identity = await authClient.getIdentity();

    if (identity) {
      setIsAuthenticatedLocal(true);
      setIdentity(identity);
      // TODO notify opener
    } else {
      console.error('Could not get identity from internet identity');
    }
  };

  async function logout() {
    setIsAuthenticatedLocal(false);

    if (!authClient.ready) {
      return;
    }

    await authClient.logout();
  }

  return {
    isAuthentificated,
    isAuthReady: isAuthClientReady,
    identity,
    login,
    logout,
    authClient,
  };
}

const authContext = createContext<AuthContext>(null!);

export function ProvideAuth({ children }: any) {
  const auth = useProvideAuth(authenticationClient);

  return <authContext.Provider value={auth}>{children}</authContext.Provider>;
}

export const useAuth = () => useContext(authContext);
