import { useState, useEffect } from 'react';
import { Permission } from 'union-ts';
import { useUnion } from '../../services/controllers';
import { useCurrentUnion } from './context';

export interface UseAttachedPermissionsProps {
  roleId: number | string | null | undefined;
}

export const useAttachedPermissions = ({ roleId }: UseAttachedPermissionsProps) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const { principal } = useCurrentUnion();
  const { data, canister, fetching, errors } = useUnion(principal);

  useEffect(() => {
    if (roleId == undefined || roleId == null) {
      return;
    }

    if (
      !!fetching.get_permissions_attached_to_roles ||
      !!data.get_permissions_attached_to_roles ||
      !!errors.get_permissions_attached_to_roles
    ) {
      return;
    }

    canister
      .get_permissions_attached_to_roles({
        role_ids: [Number(roleId)],
      })
      .then(({ result }) => {
        const ids = result.map(([, permissionIds]) => permissionIds).flat();

        if (!ids.length) {
          return;
        }
        canister.get_permissions({ ids }).then(({ permissions }) => setPermissions(permissions));
      });
  }, [
    data.get_permissions_attached_to_roles,
    fetching.get_permissions_attached_to_roles,
    errors.get_permissions_attached_to_roles,
    setPermissions,
  ]);

  const progress = !!fetching.get_permissions_attached_to_roles || !!fetching.get_permissions;

  return {
    fetching: progress,
    permissions,
  };
};
