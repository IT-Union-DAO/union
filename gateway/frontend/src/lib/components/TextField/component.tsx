import React, { useCallback, useState } from 'react';
import styled, { css } from 'styled-components';
import InputMask, { Props as InputMaskProps } from 'react-input-mask';
import { Text, getFontStyles } from '../Text';
import { Checkbox } from '../Checkbox';
import { withBorder } from '../withBorder';
import { Row } from '../Layout';

const HelperText = styled(Text)`
  color: red;
`;
const Label = styled(Text)`
  ${getFontStyles('p3', 'medium')}
`;
const Input = withBorder(
  styled.input`
    min-height: 32px;
    outline: none;
    background-color: ${({ theme }) => theme.colors.light};
    color: ${({ theme }) => theme.colors.dark};

    ${getFontStyles('p3', 'regular')}
  `,
  { quadFillColor: 'rgba(0, 0,0,0)' },
);

const RowInputWrapper = styled(Row)`
  & > ${Input} {
    flex-grow: 1;
  }
`;

const Container = styled.div<{ $disabled?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 32px;
  ${({ $disabled }) =>
    ($disabled
      ? css`
          pointer-events: none;
          opacity: 0.5;
        `
      : '')};

  ${Label} {
    margin-bottom: 4px;
  }

  ${HelperText} {
    position: absolute;
    bottom: 0;
    left: 0;
    transform: translateY(100%);
  }
`;

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  helperText?: string | undefined | null;
  startAdornment?: React.ReactNode;
  noBorder?: boolean;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ className, style, label, helperText, startAdornment, noBorder, disabled, ...p }, ref) => (
    <Container className={className} style={style} $disabled={disabled}>
      {label && <Label>{label}</Label>}
      <RowInputWrapper>
        {startAdornment}
        {/* @ts-expect-error */}
        <Input {...p} disabled={disabled} ref={ref} noBorder={noBorder} />
      </RowInputWrapper>
      {helperText && <HelperText variant='caption'>{helperText}</HelperText>}
    </Container>
  ),
);

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  helperText?: string | undefined | null;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, style, label, helperText, disabled, ...p }, ref) => (
    <Container className={className} style={style} $disabled={disabled}>
      {label && <Label>{label}</Label>}
      <Input {...p} disabled={disabled} as='textarea' ref={ref} />
      {helperText && <HelperText variant='caption'>{helperText}</HelperText>}
    </Container>
  ),
);

export interface MaskedTextFieldProps extends InputMaskProps {
  label?: React.ReactNode;
  helperText?: string | undefined | null;
}

export const MaskedTextField = React.forwardRef<HTMLInputElement, MaskedTextFieldProps>(
  ({ className, style, label, helperText, disabled, ...p }, ref) => (
    <Container className={className} style={style} $disabled={disabled}>
      {label && <Label>{label}</Label>}
      <Input {...p} disabled={disabled} as={InputMask} inputRef={ref} />
      {helperText && <HelperText variant='caption'>{helperText}</HelperText>}
    </Container>
  ),
);

export interface OptionalTextFieldProps extends Omit<TextFieldProps, 'startAdornment'> {
  defaultActive?: boolean;
}

export const OptionalTextField = React.forwardRef<HTMLInputElement, OptionalTextFieldProps>(
  ({ onChange, defaultActive = false, ...p }, ref) => {
    const [checked, setChecked] = useState(defaultActive);
    const handleCheck = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newChecked = !checked;

        if (onChange) {
          // @ts-expect-error
          onChange({ ...e, target: { ...e.target, value: newChecked ? '' : undefined } });
        }
        setChecked((checked) => !checked);
      },
      [onChange, setChecked, checked],
    );

    return (
      <TextField
        ref={ref}
        {...p}
        disabled={p.disabled || !checked}
        onChange={onChange}
        startAdornment={<Checkbox onChange={handleCheck} checked={checked} />}
      />
    );
  },
);
