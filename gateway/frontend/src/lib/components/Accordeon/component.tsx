import * as React from 'react';
import AnimateHeight from 'react-animate-height';
import { CSSTransition } from 'react-transition-group';
import { Container, Header, HeaderHandler, Children, Arrow, Title, Borders } from './styles';
import { ExpanderContext } from './context';

const DEFAULT_TIMEOUT = 300;

export interface AccordeonProps {
  className?: string;
  style?: React.CSSProperties;
  title: React.ReactNode;
  border?: Borders;
  isStatic?: boolean;
  disabled?: boolean;
  isDefaultOpened?: boolean;
  timeout?: number;
  children: React.ReactNode;
  onToggle?(opened: boolean): void;
}

export const Accordeon = React.forwardRef<HTMLElement, AccordeonProps>(
  (
    {
      className = '',
      style,
      title,
      border = 'border',
      timeout = DEFAULT_TIMEOUT,
      children,
      isStatic = false,
      disabled = false,
      isDefaultOpened = false,
      onToggle = () => {},
    },
    ref,
  ) => {
    const initialOpened = isDefaultOpened || !!isStatic;
    const [isOpened, setOpened] = React.useState(initialOpened);

    React.useEffect(() => {
      if (isStatic && !isOpened) {
        setOpened(true);
      }
    }, [isStatic, isOpened, setOpened]);

    const handleOpen = React.useCallback(() => {
      if (!isStatic && !disabled) {
        setOpened(!isOpened);
        onToggle(!isOpened);
      }
    }, [isOpened, isStatic, disabled, onToggle]);

    const height = isOpened ? 'auto' : 0;

    return (
      <ExpanderContext.Provider
        value={{
          onClick: handleOpen,
          isStatic,
        }}
      >
        <Container ref={ref} className={className} style={style} border={border}>
          <HeaderHandler onClick={handleOpen} isStatic={isStatic} border={border}>
            <Header>
              <Title variant='h5'>{title}</Title>
            </Header>
            {!isStatic && !disabled && <Arrow $isOpened={!!isOpened} />}
          </HeaderHandler>
          <AnimateHeight height={height} duration={timeout}>
            <CSSTransition in={isOpened} unmountOnExit timeout={timeout}>
              <Children>{children}</Children>
            </CSSTransition>
          </AnimateHeight>
        </Container>
      </ExpanderContext.Provider>
    );
  },
);
