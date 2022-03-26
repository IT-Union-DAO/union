import React from 'react';
import { Permission } from 'wallet-ts';
import { parseRole } from '../utils';
import { Info } from './Info';
import { useAttachedRoles } from './useAttachedRoles';

export interface PermissionInfoProps extends IClassName {
  editable?: boolean;
  permission: Permission;
  href: string;
}

export const PermissionInfo = ({ permission, editable, ...p }: PermissionInfoProps) => {
  const { roles, fetching } = useAttachedRoles({ permissionId: permission.id });

  return (
    <Info
      title={permission.name}
      editLink={editable ? `../permission/edit/${permission.id}` : undefined}
      fetching={fetching}
      items={roles.map((r) => ({ id: r.id, children: parseRole(r.role_type).title }))}
      {...p}
    />
  );
};
