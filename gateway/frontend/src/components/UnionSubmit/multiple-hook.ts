import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SubmitButtonProps } from '@union/components';
import { useAuth, useUnion, _SERVICE, unionIdl } from 'services';
import { useNavigate } from 'react-router-dom';
import { Principal } from '@dfinity/principal';
import { buildDecoder, buildEncoder } from '@union/serialize';
import { AnyService, EncDec, Encoder, Decoder } from './hook';
import { RemoteCallPayload } from 'union-ts';
import { MessageData } from '@union/client';

export interface UnionMultipleSubmitProps extends Pick<SubmitButtonProps, 'onClick'> {
  unionId: Principal;
  program: ({
    canisterId: Principal;
    methodName: string;
  } & EncDec)[];
  onExecuted?(payload: any, result: any): void;
}

export interface UnionMultipleSubmitResult {
  isAllowed: boolean;
  submitting: boolean;
  submit(e: React.MouseEvent<HTMLButtonElement>, payloads: any[]): Promise<any[]>;
  createVoting(payloads: any[], verbose?: { title?: string; description?: string }): void;
}

export const useUnionMultipleSubmit = ({
  unionId,
  program,
  onClick = () => {},
  onExecuted = () => {},
}: UnionMultipleSubmitProps): UnionMultipleSubmitResult => {
  const [submitting, setSubmitting] = useState(false);
  const nav = useNavigate();
  const { identity } = useAuth();
  const { canister, getMethodAccess, methodAccess } = useUnion<AnyService>(unionId);

  useEffect(() => {
    if (!identity) {
      return;
    }

    getMethodAccess({
      program,
      profile: identity.getPrincipal(),
    });
  }, []);

  const accessConfigId = useMemo(() => {
    if (!program.length) {
      return undefined;
    }

    let configs = methodAccess[program[0].methodName] || [];

    program.forEach(({ methodName }) => {
      const progConfigs = (methodAccess[methodName] || []).map((c) => c.id[0]);
      configs = configs.filter((c) => progConfigs.includes(c.id[0]));
    });

    return configs.length ? configs[0].id[0] : undefined;
  }, [methodAccess, program]);

  const submit = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>, payloads: any[]): Promise<any> => {
      setSubmitting(true);

      try {
        onClick(e);

        if (payloads.length !== program.length) {
          throw 'Wrong payload length';
        }
        if (typeof accessConfigId == 'undefined') {
          throw 'No access';
        }

        console.log(`\x1b[33mexecute multiple`, { program, payloads });

        const programPayload: RemoteCallPayload[] = program.map(
          ({ canisterId, methodName, encode, decode }, i) => {
            const encoder = buildEncoder(unionIdl) as Encoder;
            const payload = payloads[i];
            const encoded = encode ? encode(payload) : encoder[methodName](...(payload || []));
            return {
              endpoint: { canister_id: canisterId, method_name: methodName },
              cycles: BigInt(0),
              args: { Encoded: [...new Uint8Array(encoded)] },
            };
          },
        );

        const { result } = await canister.execute({
          access_config_id: accessConfigId,
          program: {
            RemoteCallSequence: programPayload,
          },
        });

        if (!('RemoteCallSequence' in result)) {
          throw new Error('No RemoteCallSequence result');
        }

        const responses = result.RemoteCallSequence;

        const decoder = buildDecoder(unionIdl) as Decoder;

        const decodedResults = await Promise.all(
          responses.map(async (response, i) => {
            if ('Err' in response) {
              throw new Error(`${response.Err[0]}: ${response.Err[1]}`);
            }

            const { buffer } = new Uint8Array(response.Ok);

            const { methodName, decode } = program[i];

            const decoded = decode ? decode(buffer) : (await decoder[methodName](buffer))[0];

            return { decoded };
          }),
        );

        onExecuted(payloads, decodedResults);
        setSubmitting(false);

        return decodedResults;
      } catch (e) {
        setSubmitting(false);
        throw e;
      }
    },
    [program, onClick, onExecuted, setSubmitting, accessConfigId],
  );

  const createVoting = useCallback(
    async (payloads: any[], verbose?: { title?: string; description?: string }) => {
      const principal = identity?.getPrincipal();
      let name = principal ? principal.toString() : '';

      if (principal) {
        try {
          const profileName = (
            await canister.get_profile({ id: principal, query_delegation_proof_opt: [] })
          )?.profile.name;
          name = `${profileName} (${name})`;
        } catch (e) {}
      }

      console.log(`\x1b[33mcreate voting`, payloads);
      const encoder = buildEncoder(unionIdl) as Encoder;

      const programPayload: RemoteCallPayload[] = program.map(
        ({ canisterId, methodName, encode }, i) => {
          const payload = payloads[i];
          const encoded = encode ? encode(payload) : encoder[methodName](...(payload || []));
          return {
            endpoint: { canister_id: canisterId, method_name: methodName },
            cycles: BigInt(0),
            args: { Encoded: [...new Uint8Array(encoded)] },
          };
        },
      );

      const methodName = program.map((p) => p.methodName).join();

      const state: MessageData = {
        voting: {
          name: verbose?.title || `Execution of ${methodName}`,
          description:
            verbose?.description ||
            `User "${name}" propose to execute "${methodName}". This is automatic messsage.`,
          winners_need: 1,
        },
        choices: [
          {
            name: `Approve method execution`,
            description: `I agree with execution of "${methodName}"`,
            program: {
              RemoteCallSequence: programPayload,
            },
          },
        ],
      };

      nav(`/wallet/${unionId}/votings/crud/execute`, { state });
    },
    [program, unionId],
  );

  return {
    isAllowed: typeof accessConfigId !== 'undefined',
    submitting,
    submit,
    createVoting,
  };
};
