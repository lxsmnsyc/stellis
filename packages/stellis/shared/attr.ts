import {
  BOOLEANISH_PROPS,
  BOOLEAN_PROPS,
  NUMERIC_PROPS,
  OVERLOADED_BOOLEAN_PROPS,
  POSITIVE_NUMERIC_PROPS,
} from './constants';
import $$escape from './escape-string';

export type Serializable =
  | string
  | number
  | boolean
  | undefined
  | bigint
  | RegExp
  | null;

function attrInternal(
  name: string,
  value: Serializable,
): string {
  if (BOOLEANISH_PROPS.has(name)) {
    if (value == null || typeof value === 'number') {
      return '';
    }
    return `${name}=${String(value)}`;
  }
  if (BOOLEAN_PROPS.has(name)) {
    if (typeof value === 'boolean') {
      return name;
    }
    return '';
  }
  if (OVERLOADED_BOOLEAN_PROPS.has(name)) {
    if (typeof value === 'boolean') {
      return name;
    }
    if (value != null) {
      if (typeof value === 'number') {
        return `${name}="${String(value)}"`;
      }
      return `${name}="${$$escape(String(value))}"`;
    }
    return '';
  }
  if (POSITIVE_NUMERIC_PROPS.has(name)) {
    let parsedValue: number | undefined;
    if (typeof value === 'string') {
      parsedValue = Number(value);
    } else if (typeof value === 'number') {
      parsedValue = value;
    }
    if (parsedValue && parsedValue > 0) {
      return `${name}="${String(value)}"`;
    }
    return '';
  }
  if (NUMERIC_PROPS.has(name)) {
    let parsedValue: number | undefined;
    if (typeof value === 'string') {
      parsedValue = Number(value);
    } else if (typeof value === 'number') {
      parsedValue = value;
    }
    if (parsedValue != null) {
      return `${name}="${String(value)}"`;
    }
    return '';
  }
  if (value == null) {
    return '';
  }
  return `${name}="${$$escape(String(value))}"`;
}

export default function $$attr(
  name: string,
  value: Serializable,
): { t: string } {
  return { t: attrInternal(name, value) };
}
