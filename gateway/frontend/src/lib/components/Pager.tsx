import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Text } from './Text';
import { Spinner as SP } from './Spinner';
import { SubmitButton as SB } from './Button';

const Zeroscreen = styled(Text)``;
const Error = styled(Text)`
  color: red;
`;

const SubmitButton = styled(SB)``;

const Spinner = styled(SP)<{ $fetching: boolean }>`
  margin: 4px;
  align-self: center;
  transition: opacity 0.2s ease;
  opacity: ${({ $fetching }) => ($fetching ? 1 : 0)};
`;

const Item = styled.div`
  &:empty {
    display: none;
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;

  & > ${Item}:not(:last-child) {
    margin-bottom: 8px;
  }

  ${Error}, ${Zeroscreen}, ${SubmitButton} {
    align-self: center;
  }
`;

export const layout = {
  Container,
  Item,
  Spinner,
  SubmitButton,
  Zeroscreen,
  Error,
};

export interface FetchResponse<T> {
  page: {
    data: T[];
    has_next: boolean;
  };
}

export interface PagerProps<T> {
  className?: string;
  style?: React.CSSProperties;
  size?: number;
  renderItem(item: T): React.ReactNode | null | false;
  fetch(p: { index: number; size: number }): Promise<FetchResponse<T>>;
  verbose?: {
    loadMore?: string;
    zeroscreen?: string;
    error?: string;
  };
}

export const DEFAULT_PAGE_SIZE = 10;

export const Pager = <T extends {}>({
  size = DEFAULT_PAGE_SIZE,
  fetch,
  renderItem,
  verbose: verboseProps,
  ...p
}: PagerProps<T>) => {
  const [index, setIndex] = useState(0);
  const [complete, setComplete] = useState(false);
  const [data, setData] = useState<T[] | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string>('');

  const verbose = {
    loadMore: 'Load more',
    zeroscreen: 'List is empty',
    error: '',
    ...verboseProps,
  };

  useEffect(() => {
    fetchPageData();
  }, []);

  const fetchPageData = useCallback(() => {
    setFetching(true);
    setError('');
    fetch({ index, size })
      .then(({ page }) => {
        setData((data) => [...(data || []), ...page.data]);
        setIndex((index) => index + 1);
        setComplete(!page.has_next);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setFetching(false));
  }, [index, size, fetch, setData, setIndex, setFetching, setError, setComplete]);

  return (
    <Container {...p}>
      {data?.map((item, i) => (
        <Item key={String(i)}>{renderItem(item)}</Item>
      ))}
      {!!data && !data.length && !fetching && !error && (
        <Zeroscreen>{verbose.zeroscreen}</Zeroscreen>
      )}
      {!!error && (
        <Error>
          {verbose.error}: {error}
        </Error>
      )}
      {!data && <Spinner size={20} $fetching={fetching} />}
      {!!data && !complete && (
        <SubmitButton loading={fetching} onClick={fetchPageData}>
          {verbose.loadMore}
        </SubmitButton>
      )}
    </Container>
  );
};
