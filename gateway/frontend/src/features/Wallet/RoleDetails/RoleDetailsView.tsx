import React from 'react';
import styled from 'styled-components';
import { Role, Permission } from 'wallet-ts';
import { Text, TextProps, Button as B } from 'components';
import { parseRole } from '../utils';
import { PermissionDetailsView as PDV } from '../PermissionDetails';

const DetachButton = styled(B)``;
const RemoveButton = styled(B)`
  color: red;
`;
const PermissionDetailsView = styled(PDV)`
  padding: 8px;
  border: 1px solid grey;
  border-radius: 4px;
`;

const Title = styled(Text)``;
const Description = styled(Text)``;

const Controls = styled.div`
  display: flex;
  flex-direction: row;

  & > * {
    margin-right: 8px;
  }
`;
const Items = styled.div`
  display: flex;
  flex-direction: column;

  & > * {
    padding: 8px;
    border: 1px solid grey;
    border-radius: 4px;
  }

  & > *:not(:last-child) {
    margin-bottom: 16px;
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;

  ${Title}, ${Items} {
    margin-bottom: 24px;
  }
  & > ${Description} {
    margin-bottom: 16px;
  }

  ${Controls} {
    margin-bottom: 16px;
  }
`;

export interface RoleDetailsViewProps extends IClassName {
  role: Role;
  permissions: Permission[];
  enumerated: Role[];
  variant?: TextProps['variant'];
  detach?(): void;
  remove?(): void;
  edit?(): void;
  detachPermission?(r: Role, p: Permission): void;
  substractRole?(from: Role, substracted: Role): void;
}

export const RoleDetailsView = ({
  variant = 'p1',
  role,
  permissions,
  enumerated,
  detach,
  detachPermission,
  substractRole,
  remove,
  edit,
  ...p
}: RoleDetailsViewProps) => {
  const parsedRole = parseRole(role.role_type);

  return (
    <Container {...p}>
      <Controls>
        {detach && (
          <DetachButton size='S' onClick={detach}>
            Отвязать
          </DetachButton>
        )}
        {edit && !('Everyone' in role.role_type) && (
          <DetachButton size='S' onClick={edit}>
            Редактировать
          </DetachButton>
        )}
        {remove && (
          <RemoveButton size='S' onClick={remove}>
            Удалить
          </RemoveButton>
        )}
      </Controls>
      <Description variant={variant}>Имя: {parsedRole.title}</Description>
      <Description variant={variant}>Описание: {parsedRole.description}</Description>
      <Description variant={variant}>Тип: {parsedRole.type}</Description>
      {!!parsedRole.principal && (
        <Description variant={variant}>Принципал: {parsedRole.principal}</Description>
      )}
      {!!parsedRole.threshold && (
        <Description variant={variant}>Пороговое значение: {parsedRole.threshold}</Description>
      )}
      {!!enumerated.length && (
        <>
          <Title variant='h4'>Связанные роли</Title>
          <Items>
            {enumerated.map((e) => (
              <RoleDetailsView
                key={e.id}
                variant='p3'
                role={e}
                permissions={[]}
                enumerated={[]}
                detach={() => substractRole && substractRole(role, e)}
              />
            ))}
          </Items>
        </>
      )}
      {!!permissions.length && (
        <>
          <Title variant='h4'>Пермиссии</Title>
          <Items>
            {permissions.map((permission) => (
              <PermissionDetailsView
                key={permission.id}
                variant='p3'
                permission={permission}
                roles={[]}
                detach={() => detachPermission && detachPermission(role, permission)}
              />
            ))}
          </Items>
        </>
      )}
    </Container>
  );
};
