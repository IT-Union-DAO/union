import { Principal } from '@dfinity/principal';
import { Accordeon, Chips, Column, Field, Row, Text } from '@union/components';
import moment from 'moment';
import React, { useEffect, useMemo, useRef } from 'react';
import { get } from 'react-hook-form';
import styled from 'styled-components';
import { Voting } from 'union-ts';
import { ViewProps, ViewerSettings, defaultFieldProps } from '../../IDLRenderer';
import { ProfileInfo } from '../Profile';
import { VotingConfigInfo } from '../VotingConfigs';
import { StatusChips } from './atoms';
import { WinnersChoicesInfo } from './WinnersChoicesInfo';

const Title = styled(Row)`
  align-items: center;
`;

const Container = styled(Column)`
  padding: 8px 0;
`;

export interface VotingItemProps {
  className?: string;
  style?: React.CSSProperties;
  unionId: Principal;
  voting: Voting;
  opened?: boolean;
  children?: React.ReactNode;
  View(p: ViewProps<Voting>): JSX.Element;
}

export const VotingItem = styled(
  ({ voting, opened, children, View, unionId, ...p }: VotingItemProps) => {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
      if (!opened || !ref.current) {
        return;
      }
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const settings: ViewerSettings<Voting> = useMemo(
      () => ({
        fields: {
          name: { hide: true },
          id: { hide: true },
          task_id: { hide: true },
          description: { hide: true },
          proposer: {
            order: 10,
            adornment: {
              kind: 'replace',
              render: (ctx, path, name) => (
                <Field title={name} {...defaultFieldProps}>
                  <ProfileInfo profileId={ctx.value.proposer} />
                </Field>
              ),
            },
          },

          winners_need: { order: 12 },
          created_at: {
            order: 14,
            adornment: {
              kind: 'replace',
              render: (ctx, path, name) => (
                <Field title={name} {...defaultFieldProps} align='row'>
                  {moment(Number(ctx.value.created_at) / 10 ** 6).format("DD MMM'YY HH:mm:SS")}
                </Field>
              ),
            },
          },
          updated_at: {
            hide: true,
          },
          voting_config_id: {
            order: 17,
            label: 'Voting config',
            adornment: {
              kind: 'replace',
              render: (ctx, path, name) => (
                <Field title={name} {...defaultFieldProps}>
                  <VotingConfigInfo
                    votingConfigId={get(ctx.value, path)}
                    to={`../voting-configs/${get(ctx.value, path)}`}
                  />
                </Field>
              ),
            },
          },
          status: { order: 11 },
          approval_choice: {
            hide: true,
          },
          rejection_choice: {
            hide: true,
          },
          choices: {
            hide: true,
          },
          total_voting_power_by_group: {
            hide: true,
          },
          winners: {
            hide: true,
          },
          losers: {
            hide: true,
          },
        },
      }),
      [voting, unionId],
    );

    return (
      <Accordeon
        title={
          <Title>
            <Text variant='h5' weight='medium'>
              {voting.name}
            </Text>{' '}
            <StatusChips variant='caption' weight='medium' status={voting.status} />
          </Title>
        }
        ref={ref}
        isDefaultOpened={opened}
        {...p}
      >
        <Container>
          {children}
          <Text variant='p3' color='grey'>
            {voting.description}
          </Text>
          <View value={voting} settings={settings} />
          <WinnersChoicesInfo voting={voting} unionId={unionId} />
        </Container>
      </Accordeon>
    );
  },
)``;
