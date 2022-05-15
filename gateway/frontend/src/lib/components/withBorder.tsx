import * as React from 'react';
import styled from 'styled-components';
import { theme } from './theme';

interface WithBorderProps {
  className?: string;
  style?: React.CSSProperties;
}
export interface WithBorderOptions {
  color?: string;
  hoverColor?: string;
  size?: number;
  withQuad?: boolean;
  quadFillColor?: string;
  hoverQuadFillColor?: string;
}

const defaultOptions: WithBorderOptions = {
  color: theme.colors.grey,
  size: 8,
  withQuad: true,
  quadFillColor: theme.colors.dark,
};

export const withBorder = <
  P extends object,
  R extends React.JSXElementConstructor<P> = React.JSXElementConstructor<P>
>(
  Component: R,
  opts: WithBorderOptions = {},
): R => {
  const options = { ...defaultOptions, ...opts };
  const StyledComponent = styled(Component)`
    border: none;
  `;

  const BorderSlice = styled.i``;

  const BorderWrapper = styled.div`
    --color: ${options.color};
    --slice: ${options.size}px;

    position: relative;
    display: flex;
    border-top: 1px solid var(--color);
    border-left: 1px solid var(--color);
    transition: border-color 0.2s ease;
    padding: 0 1px 1px 0;

    &:hover {
      border-color: ${options.hoverColor || options.color};

      &::before,
      &::after {
        border-color: ${options.hoverColor || options.color};
      }
    }
    &:hover ${BorderSlice} {
      &::before {
        border-color: ${options.hoverColor || options.color};
      }
      &::after {
        border-color: ${options.hoverColor || options.color};
        background-color: ${options.hoverQuadFillColor || options.quadFillColor};
      }
    }

    & > ${StyledComponent} {
      width: 100%;
    }

    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
    }

    &::before {
      bottom: var(--slice);
      border-right: 1px solid var(--color);
      transition: border-color 0.2s ease;
    }
    &::after {
      right: var(--slice);
      border-bottom: 1px solid var(--color);
      transition: border-color 0.2s ease;
    }

    ${BorderSlice} {
      pointer-events: none;
      &::before,
      &::after {
        content: '';
        position: absolute;
        height: var(--slice);
        width: var(--slice);
        transition: background-color, border-color 0.2s ease;
      }

      &::before {
        right: 0;
        bottom: 0;
        border-top: 1px solid var(--color);
        border-left: 1px solid var(--color);
        background-color: white;
      }
      &::after {
        content: ${options.withQuad ? "''" : 'none'};
        width: var(--slice);
        height: var(--slice);
        right: -1px;
        bottom: calc(-1 * var(--slice) - 1px);
        border: 1px solid var(--color);
        background-color: ${options.quadFillColor};
      }
    }
  `;

  const WrappedComponent = (({
    className,
    style,
    as,
    ...props
  }: P & WithBorderProps & { as: any }) => (
    <BorderWrapper className={className} style={style}>
      <BorderSlice />
      {/* @ts-expect-error */}
      <StyledComponent {...(props as P)} forwardedAs={as} />
    </BorderWrapper>
  )) as R;

  // @ts-expect-error
  return styled(WrappedComponent)``;
};
