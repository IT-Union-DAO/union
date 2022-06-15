import React, { useContext, useMemo } from 'react';
import { IDL } from '@dfinity/candid';
import { Field, Column, ShiftedColumn, Row } from '@union/components';
import { get } from 'react-hook-form';
import { SettingsWrapper, getSettings, defaultFieldProps } from '../utils';
import { RenderProps, context, transformName, useSettings } from './utils';
import { Viewer } from './viewers';

export interface OptFormProps extends RenderProps {
  type: IDL.Type;
  path: string;
}
export const OptForm = ({ type, path, absolutePath, ...p }: OptFormProps) => {
  const ctx = useContext(context);
  const settings = useSettings(path, absolutePath);

  const value = path ? get(ctx.value, path) : ctx.value;
  const enabled = !!value?.length;

  const component = useMemo(
    () =>
      type.accept(
        new RenderViewer({
          path: `${path}${path ? '.' : ''}0`,
          absolutePath: `${absolutePath}${absolutePath ? '.' : ''}0`,
        }),
        null,
      ),
    [type, path, absolutePath],
  );
  const name = typeof settings.settings.label == 'string' ? settings.settings.label : p.name;

  return (
    <SettingsWrapper settings={settings} ctx={ctx} path={path} name={name}>
      <Field
        {...defaultFieldProps}
        title={name}
        align={enabled ? 'column' : 'row'}
        color={enabled ? 'dark' : 'grey'}
      >
        {enabled ? <ShiftedColumn>{component}</ShiftedColumn> : 'null'}
      </Field>
    </SettingsWrapper>
  );
};

export interface RecordFormProps extends RenderProps {
  fields: Array<[string, IDL.Type]>;
  path: string;
}
export const RecordForm = ({ fields, path, absolutePath, ...p }: RecordFormProps) => {
  const ctx = useContext(context);
  const settings = useSettings(path, absolutePath);

  const fieldOrders = useMemo(
    () =>
      fields.reduce((acc, f) => {
        const fieldPath = `${path}${path ? '.' : ''}${f[0]}`;
        const fieldAbsPath = `${absolutePath}${absolutePath ? '.' : ''}${f[0]}`;
        const s = getSettings(fieldPath, fieldAbsPath, ctx.settings);

        return { ...acc, [fieldPath]: s.settings?.order || 100 };
      }, {} as Record<string, number>),
    [absolutePath, path, ctx.settings, fields],
  );

  const orderedFields = useMemo(
    () =>
      fields.sort((a, b) => {
        const aOrder = fieldOrders[`${path}${path ? '.' : ''}${a[0]}`] || 100;
        const bOrder = fieldOrders[`${path}${path ? '.' : ''}${b[0]}`] || 100;

        return aOrder - bOrder;
      }),
    [fields, fieldOrders],
  );

  const name = typeof settings.settings.label == 'string' ? settings.settings.label : p.name;
  const Wrapper = path ? ShiftedColumn : Column;

  return (
    <SettingsWrapper settings={settings} ctx={ctx} path={path} name={name}>
      <Field {...defaultFieldProps} title={name}>
        <Wrapper margin={8}>
          {orderedFields.map(([key, field]) => {
            const currentPath = `${path}${path ? '.' : ''}${key}`;

            return field.accept(
              new RenderViewer({
                path: currentPath,
                absolutePath: `${absolutePath}${absolutePath ? '.' : ''}${key}`,
                key: currentPath,
                name: ctx.transformLabel(key, transformName),
              }),
              null,
            );
          })}
        </Wrapper>
      </Field>
    </SettingsWrapper>
  );
};

export interface VariantFormProps extends RenderProps {
  fields: Array<[string, IDL.Type]>;
  path: string;
}
export const VariantForm = ({ fields, path, absolutePath, ...p }: VariantFormProps) => {
  const ctx = useContext(context);
  const settings = useSettings(path, absolutePath);
  const value = (path ? get(ctx.value, path) : ctx.value) || {};

  const selected = useMemo(() => {
    const keys = Object.keys(value);

    return fields.find(([key]) => key == keys[0]) || null;
  }, [value, fields]);

  const selectedItem = useMemo(() => {
    if (!selected) {
      return null;
    }

    return selected[1].accept(
      new RenderViewer({
        path: `${path}${path ? '.' : ''}${selected[0]}`,
        absolutePath: `${absolutePath}${absolutePath ? '.' : ''}${selected[0]}`,
        // name: ctx.transformLabel(selected[0], transformName),
      }),
      null,
    );
  }, [selected, fields, ctx.transformLabel, path, absolutePath]);

  const name = typeof settings.settings.label == 'string' ? settings.settings.label : p.name;

  return (
    <SettingsWrapper settings={settings} ctx={ctx} path={path} name={name}>
      <Field
        {...defaultFieldProps}
        title={`${name || ''}${name && selected ? ': ' : ''}${
          selected ? ctx.transformLabel(selected[0], transformName) : ''
        }`}
        align='column'
      >
        <Column>{selectedItem}</Column>
      </Field>
    </SettingsWrapper>
  );
};

export interface VecFormProps extends RenderProps {
  type: IDL.Type;
  path: string;
}
export const VecForm = ({ path, type, absolutePath, ...p }: VecFormProps) => {
  const ctx = useContext(context);
  const settings = useSettings(path, absolutePath);

  const value = path ? get(ctx.value, path) : ctx.value;
  const items = value || [];

  // const isSimpleValues = useMemo(
  //   () => !items.find((i: any) => i !== null || ['function', 'object'].includes(typeof i)),
  //   [items],
  // );
  const isSimpleValues = false;
  const align = useMemo(() => {
    if (isSimpleValues) {
      return 'row';
    }
    return items.length ? 'column' : 'row';
  }, [items, isSimpleValues]);

  const VecWrapper = align == 'row' ? Row : Column;
  const name = typeof settings.settings.label == 'string' ? settings.settings.label : p.name;

  return (
    <SettingsWrapper settings={settings} ctx={ctx} path={path} name={name}>
      <Field {...defaultFieldProps} title={name} align={align}>
        {items?.length ? (
          <VecWrapper margin={8} style={{ flexWrap: 'wrap' }}>
            {items.map((_: any, i: number) => {
              const component = type.accept(
                new RenderViewer({
                  path: `${path}${path ? '.' : ''}${i}`,
                  absolutePath: `${absolutePath}${absolutePath ? '.' : ''}-1`,
                }),
                null,
              );

              return (
                <ShiftedColumn withSeparator={false} key={String(i)}>
                  {component}
                </ShiftedColumn>
              );
            })}
          </VecWrapper>
        ) : (
          'empty'
        )}
      </Field>
    </SettingsWrapper>
  );
};

export interface TupleFormProps extends RenderProps {
  fields: IDL.Type[];
  path: string;
}
export const TupleForm = ({ fields, path, absolutePath, ...p }: TupleFormProps) => {
  const ctx = useContext(context);
  const settings = useSettings(path, absolutePath);

  const children = useMemo(
    () =>
      fields.map((type, i) =>
        type.accept(
          new RenderViewer({
            path: `${path}${path ? '.' : ''}${i}`,
            absolutePath: `${absolutePath}${absolutePath ? '.' : ''}${i}`,
            key: String(i),
          }),
          null,
        ),
      ),
    [fields, path],
  );
  const name = typeof settings.settings.label == 'string' ? settings.settings.label : p.name;

  return (
    <SettingsWrapper settings={settings} ctx={ctx} path={path} name={name}>
      <Field {...defaultFieldProps} title={name} align='column'>
        {children}
      </Field>
    </SettingsWrapper>
  );
};

export const NullForm = (_: RenderProps) => null;

export class RenderViewer extends IDL.Visitor<null, JSX.Element | null> {
  constructor(protected props: RenderProps) {
    super();
  }

  public visitType<T>(t: IDL.Type<T>) {
    return t.accept(new Viewer(this.props), null);
  }
  public visitNull(t: IDL.NullClass) {
    return <NullForm {...this.props} />;
  }
  public visitRecord(t: IDL.RecordClass, fields: Array<[string, IDL.Type]>) {
    return <RecordForm {...this.props} fields={fields} />;
  }
  public visitTuple<T extends any[]>(t: IDL.TupleClass<T>, components: IDL.Type[]) {
    return <TupleForm {...this.props} fields={components} />;
  }
  public visitVariant(t: IDL.VariantClass, fields: Array<[string, IDL.Type]>) {
    return <VariantForm {...this.props} fields={fields} />;
  }
  public visitOpt<T>(t: IDL.OptClass<T>, ty: IDL.Type<T>) {
    return <OptForm {...this.props} type={ty} />;
  }
  public visitVec<T>(t: IDL.VecClass<T>, ty: IDL.Type<T>) {
    return <VecForm type={ty} {...this.props} />;
  }
  public visitRec<T>(t: IDL.RecClass<T>, ty: IDL.ConstructType<T>): JSX.Element | null {
    return ty.accept<null, JSX.Element | null>(new RenderViewer(this.props), null);
  }
}
