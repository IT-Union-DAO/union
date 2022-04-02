import React, { useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { Text, Button as B } from 'components';
import { NavLink as N } from 'react-router-dom';
import { HistoryEntry } from 'wallet-ts';
import { useWallet } from 'services';
import { useCurrentWallet } from '../context';
import { Item as I } from './Item';

const Title = styled(Text)``;
const Button = styled(B)``;
const Item = styled(I)``;
const NavLink = styled(N)``;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding-bottom: 32px;

  ${Title} {
    margin-bottom: 64px;
  }
  ${NavLink} {
    text-decoration: none;
  }
  ${NavLink}:not(:last-child) {
    margin-bottom: 24px;
  }
  ${Button} {
    align-self: flex-end;
  }
`;

export interface HistoryProps extends IClassName {
  createLink?: string;
}

export function History({ createLink, ...p }: HistoryProps) {
  const { rnp, principal } = useCurrentWallet();
  const { canister, fetching, data } = useWallet(principal);

  useEffect(() => {
    canister.get_scheduled_for_authorization_executions({ task_ids: [] });
    canister.get_history_entry_ids().then(({ ids }) => canister.get_history_entries({ ids }));
  }, [canister]);

  const progress =
    !!fetching.get_history_entry_ids ||
    !!fetching.get_history_entries ||
    !!fetching.get_scheduled_for_authorization_executions;

  const scheduled = data.get_scheduled_for_authorization_executions?.entries || [];
  const history = data.get_history_entries?.entries || [];

  const entries: [bigint | null, HistoryEntry][] = useMemo(
    () =>
      [...scheduled, ...history.map<[bigint | null, HistoryEntry]>((entry) => [null, entry])].sort(
        (a, b) => Number(b[1].timestamp) - Number(a[1].timestamp),
      ),
    [scheduled, history],
  );

  return (
    <Container {...p}>
      <Title variant='h2'>История произвольных вызовов</Title>
      {!!createLink && !!rnp && (
        <Button forwardedAs={NavLink} to={createLink}>
          + Создать произвольный вызов
        </Button>
      )}
      {progress && <span>Fetching...</span>}
      {!progress && !entries.length && <span>История пуста</span>}
      {entries.map(([taskId, entry]) => (
        <NavLink
          key={String(entry.id)}
          to={taskId !== null ? `scheduled/${String(taskId)}` : String(entry.id)}
        >
          <Item entry={entry} />
        </NavLink>
      ))}
    </Container>
  );
}
