import React from 'react';
import styled from 'styled-components';
import { Text } from '../Text';

const Label = styled(Text)``;
const Input = styled.input`
  min-height: 32px;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 32px;

  ${Label} {
    margin-bottom: 4px;
  }
`;

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ className, style, label, ...p }, ref) => (
    <Container className={className} style={style}>
      <Label variant='p1'>{label}</Label>
      <Input {...p} ref={ref} />
    </Container>
  ),
);

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, style, label, ...p }, ref) => (
    <Container className={className} style={style}>
      <Label variant='p1'>{label}</Label>
      <Input {...p} as='textarea' ref={ref} />
    </Container>
  ),
);
