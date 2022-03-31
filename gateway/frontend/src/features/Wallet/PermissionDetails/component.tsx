import React from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Text } from 'components';
import { useTrigger } from 'toolkit';
import { useWallet } from 'services';
import { useCurrentWallet } from '../context';
import { useAttachedRoles } from '../useAttachedRoles';
import { useRemove } from '../useRemove';
import { useDetach } from '../useDetach';
import { PermissionDetailsView } from './PermissionDetailsView';
import { RolesAttacher } from './RolesAttacher';

const Title = styled(Text)`
  margin-bottom: 64px;
`;

export interface PermissionDetailsProps {
  edit(permissionId: number): void;
}

export const PermissionDetails = ({ edit }: PermissionDetailsProps) => {
  const { permissionId } = useParams();
  const { removePermission } = useRemove();
  const { detachRoleAndPermission } = useDetach();
  const { rnp, principal } = useCurrentWallet();
  const { canister, fetching, data } = useWallet(principal);
  const { roles } = useAttachedRoles({ permissionId });

  useTrigger(
    (rnp) => {
      canister.get_permissions({ rnp, ids: [Number(permissionId)] });
    },
    rnp,
    [permissionId],
  );

  const permission = data.get_permissions?.permissions[0];

  if (!permissionId) {
    return <span>Unknown permission {permissionId}</span>;
  }

  if (fetching.get_permissions) {
    return <span>fetching</span>;
  }

  if (!permission) {
    return <span>Permission not found</span>;
  }

  return (
    <>
      <Title variant='h2'>{permission.name}</Title>
      <PermissionDetailsView
        permission={permission}
        roles={roles}
        detachRole={detachRoleAndPermission}
        remove={() => removePermission([permission.id])}
        edit={() => edit(permission.id)}
      />
      <RolesAttacher permission={permission} />
    </>
  );
};
