import {
  BOOLEANISH_PROPS,
  BOOLEAN_PROPS,
  NUMERIC_PROPS,
  OVERLOADED_BOOLEAN_PROPS,
  POSITIVE_NUMERIC_PROPS,
} from './constants';
import escapeString from './escape-string';

function attrInternal(
  name: string,
  value: number | boolean | string | undefined | null,
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
        return `${name}=${String(value)}`;
      }
      return `${name}="${escapeString(value)}"`;
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
  return `${name}="${escapeString(String(value))}"`;
}

export default function $$attr(
  name: string,
  value: number | boolean | string | undefined | null,
): { t: string } {
  return { t: attrInternal(name, value) };
}
