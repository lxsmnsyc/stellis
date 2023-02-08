import type { JSX } from './jsx';
import $$attr from '../shared/attr';
import $$escape from '../shared/escape-string';
import { forEach, join } from '../shared/arrays';
import { CHILDREN_KEY, SET_HTML_KEY, VOID_ELEMENTS } from '../shared/constants';

export { JSX, $$attr, $$escape };

interface Owner {
  parent?: Owner;
  prefix?: string;
  index: number;
  map: Record<string, any>;
}

let OWNER: Owner | undefined;

export interface ContextKey<T> {
  id: string;
  defaultValue: T;
}

let CONTEXT = 0;

export function createContext<T>(defaultValue: T): ContextKey<T> {
  const id = `context-${CONTEXT}`;
  CONTEXT += 1;
  return {
    id,
    defaultValue,
  };
}

export function setContext<T>(key: ContextKey<T>, value: T): void {
  if (OWNER) {
    OWNER.map[key.id] = value;
  }
}

export function getContext<T>(key: ContextKey<T>): T {
  let current = OWNER;
  while (current) {
    if (key.id in current.map) {
      return current.map[key.id] as T;
    }
    current = OWNER?.parent;
  }
  return key.defaultValue;
}

export type Component<P> = (props: P) => JSX.Element;

export function createID(): string {
  if (OWNER) {
    const result = OWNER.prefix ? `${OWNER.prefix}-${OWNER.index}` : `${OWNER.index}`;
    OWNER.index += 1;
    return result;
  }
  throw new Error('Unable to use createID outside of render');
}

type Resolved =
  | JSX.SafeElement
  | Promise<JSX.SafeElement>;

export function $$node(element: JSX.Element): Resolved {
  // Skip nullish and booleans
  if (
    element == null
    || element === true
    || element === false
  ) {
    return { t: '' };
  }
  // return for number or strings
  if (typeof element === 'number' || typeof element === 'string') {
    return { t: $$escape(`${element}`) };
  }
  // Recursive for functions
  if (typeof element === 'function') {
    return $$node(element());
  }
  if (Array.isArray(element)) {
    if (element.length === 0) {
      return { t: '' };
    }
    if (element.length === 1) {
      return $$node(element[0]);
    }
    const els: Resolved[] = [];

    // Try to node each item
    forEach(element, (value) => {
      els.push($$node(value));
    });

    // For precaution, await all values
    return Promise.all(els).then((nodes) => {
      let result = '';
      forEach(nodes, (n) => {
        if (n) {
          result += n.t;
        }
      });
      return { t: result };
    });
  }
  if ('t' in element) {
    return element;
  }
  const captured = OWNER;
  return element.then((value) => {
    const current = OWNER;
    OWNER = captured;
    const result = $$node(value);
    OWNER = current;
    return result;
  });
}

export function $$component<P>(Comp: Component<P>, props: P): JSX.Element {
  return () => {
    const newOwner: Owner = {
      parent: OWNER,
      prefix: OWNER ? createID() : '',
      index: 0,
      map: {},
    };
    const parent = OWNER;
    OWNER = newOwner;
    const result = $$node(Comp(props));
    OWNER = parent;
    return result;
  };
}

export async function render(element: JSX.Element): Promise<string> {
  const newOwner: Owner = {
    parent: OWNER,
    prefix: OWNER ? createID() : '',
    index: 0,
    map: {},
  };
  const parent = OWNER;
  OWNER = newOwner;
  const result = await $$node(element);
  OWNER = parent;
  return result.t;
}

export function $$html(templates: string[], ...nodes: JSX.Element[]): () => Resolved {
  // Merge
  return () => {
    const resolved: JSX.Element = [];
    forEach(templates, (template, i) => {
      resolved.push({ t: template });
      if (nodes[i]) {
        resolved.push(nodes[i]);
      }
    });
    return $$node(resolved);
  };
}

function classInternal(...classes: JSX.ClassList[]): string {
  const result: string[] = [];

  forEach(classes, (classname) => {
    if (classname) {
      if (typeof classname === 'string') {
        result.push($$escape(classname));
      } else if (typeof classname === 'number') {
        // no-op
      } else if (Array.isArray(classname)) {
        result.push(classInternal(...classname));
      } else {
        forEach(Object.keys(classname), (key) => {
          if (classname[key]) {
            result.push($$escape(key));
          }
        });
      }
    }
  });

  return join(result, ' ');
}

export function $$class(...classes: JSX.ClassList[]): JSX.SafeElement {
  return { t: `class="${classInternal(...classes)}"` };
}

function styleInternal(...values: (JSX.CSSProperties | string)[]): string {
  let result = '';
  forEach(values, (value) => {
    if (typeof value === 'string') {
      result += $$escape(value);
      if (!value.endsWith(';')) {
        result += ';';
      }
    } else {
      const keys = Object.keys(value);
      forEach(keys, (k) => {
        const v = value[k as keyof JSX.CSSProperties];
        if (v != null) {
          result += `${k}:${$$escape(`${v}`)};`;
        }
      });
    }
  });
  return result;
}

export function $$style(...values: (JSX.CSSProperties | string)[]): JSX.SafeElement {
  return { t: `style="${styleInternal(...values)}"` };
}

export function $$el<T extends keyof JSX.IntrinsicElements>(
  constructor: T,
  props: Record<string, JSX.Element>,
): () => Resolved {
  return () => {
    let result = `<${constructor}`;
    let content: JSX.Element;

    const shouldSkipChildren = VOID_ELEMENTS.test(constructor);

    const keys = Object.keys(props);

    let mainStyle: string | Record<string, string> = {};
    const subStyle: Record<string, string> = {};
    const classes: JSX.ClassList[] = [];
    let attrs = '';

    forEach(keys, (k) => {
      if (!shouldSkipChildren && content == null && (k === CHILDREN_KEY || k === SET_HTML_KEY)) {
        content = props[k];
      } else if (k === 'style') {
        const value = props[k] as string | Record<string, string> | undefined;
        if (value != null) {
          mainStyle = value;
        }
      } else if (k.startsWith('style:')) {
        const value = props[k] as string;
        if (value != null) {
          const [, key] = k.split(':');
          subStyle[key] = value;
        }
      } else if (k === 'class') {
        const list = props[k] as JSX.ClassList;
        if (list != null) {
          classes.push(list);
        }
      } else if (k.startsWith('class:')) {
        const value = props[k] as string;
        if (value) {
          const [, key] = k.split(':');
          classes.push(key);
        }
      } else {
        attrs += $$attr(k, props[k] as string).t;
      }
    });

    const mergedClasses = $$class(...classes).t;
    if (mergedClasses !== '') {
      attrs += mergedClasses;
    }

    const mergedStyles = $$style(mainStyle, subStyle).t;
    if (mergedStyles !== '') {
      attrs += mergedStyles;
    }

    if (attrs !== '') {
      result += ` ${attrs}`;
    }

    if (shouldSkipChildren) {
      return {
        t: `${result}/>`,
      };
    }
    return $$node([{ t: `${result}>` }, content, { t: `</${constructor}>` }]);
  };
}
