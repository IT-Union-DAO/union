import { authClient, Canister, CanisterProps, useCanister } from 'toolkit';
import { buildSerializer, buildEncoder } from '@union/serialize';
import { _SERVICE } from 'union-ts';
// @ts-expect-error
import { idlFactory as idl } from 'union-idl';
import { Principal } from '@dfinity/principal';

export type { _SERVICE } from 'union-ts';

export type IUnionController = Canister<_SERVICE>;

export const initWalletController = (canisterId: string, handlers?: CanisterProps['handlers']) => {
  const canister = ((window as any).wallet = new Canister<_SERVICE>({
    canisterId,
    idl,
    handlers,
    agent: authClient.agent,
  }));

  return canister;
};

export const useUnion = (canisterId: Principal) =>
  useCanister(canisterId.toString(), initWalletController);

export const walletSerializer = buildSerializer<_SERVICE>(idl);

export const walletEncoder = buildEncoder<_SERVICE>(idl);
