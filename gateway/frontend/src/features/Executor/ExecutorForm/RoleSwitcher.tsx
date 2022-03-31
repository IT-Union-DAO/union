import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Control, Controller } from 'react-hook-form';
import { Text, Select, Option } from 'components';
import { useTrigger } from 'toolkit';
import { useCurrentWallet } from '../../Wallet/context';
import { parseRole } from '../../Wallet/utils';
import { ExecutorFormData } from '../types';

const Controls = styled.div`
  display: flex;
  flex-direction: row;

  select {
    margin-right: 16px;
    height: 24px;
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;

  ${Controls} {
    margin-top: 8px;
  }
`;

export interface RoleSwitcherProps extends IClassName {
  label: string;
  disabled?: boolean;
  control: Control<ExecutorFormData, any>;
}

export const RoleSwitcher = ({ control, label, disabled, ...p }: RoleSwitcherProps) => {
  const { rnp, roles, permissions, update } = useCurrentWallet();
  const { onChange } = control.register('rnp');

  useEffect(() => {
    if (disabled) {
      return;
    }
    update();
  }, []);

  useTrigger(
    (rnp) => {
      onChange({ target: { name: 'rnp', value: rnp } });
    },
    rnp,
    [],
  );

  return (
    <Container {...p}>
      <Text variant='p1'>{label}</Text>
      <Controls>
        <Controller
          name='rnp.role_id'
          control={control}
          rules={{
            required: 'Обязательное поле',
          }}
          render={({ field }) => (
            <Select
              title='Role'
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
              disabled={disabled}
            >
              {roles.map((r) => {
                const parsed = parseRole(r.role_type);

                return (
                  <Option key={r.id} id={String(r.id)} value={String(r.id)}>
                    {parsed.title}
                  </Option>
                );
              })}
            </Select>
          )}
        />
        <Controller
          name='rnp.permission_id'
          control={control}
          rules={{
            required: 'Обязательное поле',
          }}
          render={({ field }) => (
            <Select
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
              title='Permission'
              disabled={disabled}
            >
              {permissions.map(({ id, name }) => (
                <Option key={id} id={String(id)} value={String(id)}>
                  {name}
                </Option>
              ))}
            </Select>
          )}
        />
      </Controls>
    </Container>
  );
};
