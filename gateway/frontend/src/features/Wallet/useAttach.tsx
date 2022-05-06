import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { walletSerializer } from 'services';
import { ExternalExecutorFormData } from '../Executor';
import { useCurrentUnion } from './context';

export function useAttach() {
  const nav = useNavigate();
  const { rnp, principal } = useCurrentUnion();

  const attach = useCallback(
    (
      permissionIds: (string | number)[],
      roleIds: (number | string)[],
      verbose?: { title?: string; description?: string },
    ) => {
      if (!rnp) {
        return;
      }

      const payload: ExternalExecutorFormData = {
        title: verbose?.title || 'Attach roles to permission',
        description:
          verbose?.description ||
          `Attach roles "${roleIds.join()}" to permissions "${permissionIds.join()}"`,
        rnp,
        program: {
          RemoteCallSequence: roleIds
            .map((roleId) =>
              permissionIds.map((permissionId) => ({
                endpoint: {
                  canister_id: principal,
                  method_name: 'attach_role_to_permission',
                },
                cycles: BigInt(0),
                args: {
                  CandidString: walletSerializer.attach_role_to_permission({
                    role_id: Number(roleId),
                    permission_id: Number(permissionId),
                  }),
                },
              })),
            )
            .flat(),
        },
      };

      nav(`/wallet/${principal}/execute`, { state: payload });
    },
    [nav, rnp],
  );

  return { attach };
}
