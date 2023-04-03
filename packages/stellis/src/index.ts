import type { JSX } from './jsx';
import $$attr from '../shared/attr';
import $$escape from '../shared/escape-string';
import raw, { EMPTY } from '../shared/raw';
import { CHILDREN_KEY, SET_HTML_KEY, VOID_ELEMENTS } from '../shared/constants';
import assert from '../shared/assert';

export {
  JSX, $$attr, $$escape,
};

interface Injector {
  pre: JSX.Element[];
  post: JSX.Element[];
}

interface Root {
  resolved: boolean;
  head: Injector;
  body: Injector;
}

interface Owner {
  parent?: Owner;
  prefix?: string;
  index: number;
  root?: Root;
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
    current = current?.parent;
  }
  return key.defaultValue;
}

export type Component<P> = (props: P) => JSX.Element;

export function createID(): string {
  assert(OWNER, new Error('Unable to use createID outside of render'));
  const result = OWNER.prefix ? `${OWNER.prefix}-${OWNER.index}` : `${OWNER.index}`;
  OWNER.index += 1;
  return result;
}

type Resolved =
  | JSX.SafeElement
  | Promise<JSX.SafeElement>;

function reconcileResolvedArray(resolved: Resolved[]): Resolved {
  return Promise.all(resolved).then((items) => {
    let result = '';
    for (let i = 0, len = items.length; i < len; i++) {
      result += items[i].t;
    }
    return raw(result);
  });
}

export function $$node(element: JSX.Element, escape = true): Resolved {
  // Skip nullish and booleans
  if (
    element == null
    || element === true
    || element === false
  ) {
    return EMPTY;
  }
  // return for number or strings
  if (typeof element === 'number') {
    return raw(`${element}`);
  }
  if (typeof element === 'string') {
    return raw(escape ? $$escape(element) : element);
  }
  if (typeof element === 'function') {
    return $$node(element());
  }
  if ('t' in element) {
    return element;
  }
  if (Array.isArray(element)) {
    if (element.length === 0) {
      return EMPTY;
    }
    if (element.length === 1) {
      return $$node(element[0]);
    }
    const els: Resolved[] = [];
    // Try to node each item
    for (let i = 0, len = element.length; i < len; i++) {
      els.push($$node(element[i], escape));
    }
    // For precaution, await all values
    return reconcileResolvedArray(els);
  }
  const captured = OWNER;
  return element.then((value) => {
    const current = OWNER;
    OWNER = captured;
    const result = $$node(value, escape);
    OWNER = current;
    return result;
  });
}

export function $$component<P>(Comp: Component<P>, props: P): JSX.Element {
  return () => {
    const newOwner: Owner = {
      parent: OWNER,
      prefix: OWNER ? createID() : '',
      root: OWNER?.root,
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

async function resolve(owner: Owner, el: JSX.Element) {
  const prev = OWNER;
  OWNER = owner;
  const resultPromise = $$node(el);
  OWNER = prev;
  return (await resultPromise).t;
}

async function resolveInject(owner: Owner, root: Root, result: string) {
  const [preHead, postHead, preBody, postBody] = await Promise.all([
    resolve(owner, root.head.pre),
    resolve(owner, root.head.post),
    resolve(owner, root.body.pre),
    resolve(owner, root.body.post),
  ]);
  let state = result;
  // Check if it has a <html>
  const htmlMatch = /<html\b[^>]*>/i.exec(state);
  if (htmlMatch) {
    // Check if there's a head
    const headMatch = /<head\b[^>]*>/i.exec(state);
    if (headMatch) {
      state = state.replace(headMatch[0], `${headMatch[0]}${preHead}`);
      assert(!/<\/head>/i.test(state), new Error('Missing </head>'));
      state = state.replace('</head>', `${postHead}</head>`);
    } else {
      // Create a head
      state = state.replace(htmlMatch[0], `${htmlMatch[0]}<head>${preHead}${postHead}</head>`);
    }
    // Check if it has a <body>
    const bodyMatch = /<body\b[^>]*>/i.exec(state);
    if (bodyMatch) {
      state = state.replace(bodyMatch[0], `${bodyMatch[0]}${preBody}`);
      assert(!/<\/body>/i.test(state), new Error('Missing </body>'));
      state = state.replace('</body>', `${postBody}</body>`);
    } else {
      state = state.replace('</head>', `</head><body>${preHead}`);
      state = state.replace('</html>', `${postHead}</body></html>`);
    }
  } else {
    // Check if it has a <body>
    const headMatch = /<head\b[^>]*>/i.exec(state);
    const bodyMatch = /<body\b[^>]*>/i.exec(state);
    if (bodyMatch) {
      state = state.replace(bodyMatch[0], `${bodyMatch[0]}${preBody}`);
      assert(!/<\/body>/i.test(state), new Error('Missing </body>'));
      state = state.replace('</body>', `${postBody}</body>`);
    } else if (!headMatch) {
      state = `${preBody}${state}${postBody}`;
    }
    if (headMatch) {
      state = state.replace(headMatch[0], `${headMatch[0]}${preHead}`);
      assert(!/<\/head>/i.test(state), new Error('Missing </head>'));
      state = state.replace('</head>', `${postHead}</head>`);
      if (!bodyMatch) {
        state = state.replace('</head>', `</head>${preBody}`);
        state = `${state}${postBody}`;
      }
    } else {
      state = `${preHead}${postHead}${state}`;
    }
  }

  return state;
}

export async function render(element: JSX.Element): Promise<string> {
  const root: Root = {
    resolved: false,
    head: {
      pre: [],
      post: [],
    },
    body: {
      pre: [],
      post: [],
    },
  };
  const newOwner: Owner = {
    parent: undefined,
    prefix: '',
    root,
    index: 0,
    map: {},
  };
  const resolved = await resolve(newOwner, element);
  root.resolved = true;
  // Resolve head and body
  return resolveInject(newOwner, root, resolved);
}

export function $$html(
  templates: string[] | string,
  escape: boolean,
  ...nodes: JSX.Element[]
): () => JSX.Element {
  // Merge
  return () => {
    if (typeof templates === 'string') {
      return raw(templates);
    }
    const resolved: JSX.Element = [];
    for (let i = 0, len = templates.length; i < len; i++) {
      resolved.push(raw(templates[i]));
      if (nodes[i]) {
        resolved.push(nodes[i]);
      }
    }
    return $$node(resolved, escape);
  };
}

function classInternal(...classes: JSX.ClassList[]): string {
  const result: string[] = [];

  let classname: JSX.ClassList;
  for (let i = 0, len = classes.length; i < len; i++) {
    classname = classes[i];
    if (classname) {
      if (typeof classname === 'string') {
        result.push($$escape(classname));
      } else if (typeof classname === 'number') {
        // no-op
      } else if (Array.isArray(classname)) {
        result.push(classInternal(...classname));
      } else {
        for (const key of Object.keys(classname)) {
          if (classname[key]) {
            result.push($$escape(key));
          }
        }
      }
    }
  }

  return result.join(' ');
}

export function $$class(...classes: JSX.ClassList[]): JSX.SafeElement {
  return raw(`class="${classInternal(...classes)}"`);
}

function styleInternal(...values: (JSX.CSSProperties | string)[]): string {
  let result = '';
  let value: JSX.CSSProperties | string;
  for (let i = 0, len = values.length; i < len; i++) {
    value = values[i];
    if (typeof value === 'string') {
      result += $$escape(value);
      if (!value.endsWith(';')) {
        result += ';';
      }
    } else {
      for (const key of Object.keys(value)) {
        const v = value[key as keyof JSX.CSSProperties];
        if (v != null) {
          result += `${key}:${$$escape(`${v}`)};`;
        }
      }
    }
  }
  return result;
}

export function $$style(...values: (JSX.CSSProperties | string)[]): JSX.SafeElement {
  return raw(`style="${styleInternal(...values)}"`);
}

export function $$errorBoundary(
  { fallback, children }: JSX.StellisErrorBoundaryAttributes,
): JSX.Element {
  return async () => {
    try {
      return Promise.resolve($$node(children)).catch(fallback);
    } catch (error) {
      return fallback(error);
    }
  };
}

export function $$comment({ value }: JSX.StellisCommentAttributes) {
  return raw(`<!--${$$escape(value, true)}-->`);
}

export function $$fragment(props: JSX.StellisFragmentAttributes) {
  if (props[SET_HTML_KEY]) {
    return raw(props[SET_HTML_KEY]);
  }
  return props.children;
}

export function $$inject(
  target: 'body' | 'head',
  props: JSX.StellisBodyAttributes | JSX.StellisHeadAttributes,
) {
  return () => {
    const type = props.type || 'post';
    if (OWNER && OWNER.root?.resolved === false) {
      const content = $$fragment(props);
      OWNER.root?.[target][type].push(content);
    }
    return EMPTY;
  };
}

export function $$el(
  constructor: string,
  props: Record<string, any>,
): () => JSX.Element {
  return () => {
    let result = `<${constructor}`;
    let content: JSX.Element;
    let escape = true;

    const shouldSkipChildren = VOID_ELEMENTS.test(constructor);

    if (!shouldSkipChildren) {
      content = $$fragment(props as JSX.StellisFragmentAttributes);
      escape = !(SET_HTML_KEY in props);
    }

    let mainStyle: string | Record<string, string> = {};
    const subStyle: Record<string, string> = {};
    const classes: JSX.ClassList[] = [];
    let attrs = '';

    for (const k of Object.keys(props)) {
      if (k === CHILDREN_KEY || k === SET_HTML_KEY) {
        // no-op
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
    }

    const mergedClasses = classInternal(...classes);
    if (mergedClasses !== '') {
      attrs += `class="${mergedClasses}"`;
    }

    const mergedStyles = styleInternal(mainStyle, subStyle);
    if (mergedStyles !== '') {
      attrs += `style="${mergedStyles}"`;
    }

    if (attrs !== '') {
      result += ` ${attrs}`;
    }

    if (shouldSkipChildren) {
      return {
        t: `${result}/>`,
      };
    }
    if (content && typeof content === 'object' && 't' in content) {
      return raw(`${result}>${content.t}</${constructor}>`);
    }
    const rendered = [raw(`${result}>`), content, raw(`</${constructor}>`)];
    return $$node(rendered, escape);
  };
}

type GuaranteeArray<T> = T extends Array<any>
  ? T
  : T[];

export type ExtractChildren<T extends Constructor, P = ExtractProps<T>> =
  P extends { children: infer U }
    ? GuaranteeArray<U>
    : never;

export function h<T extends Constructor>(
  el: T,
  props: ExtractProps<T> | undefined | null,
  ...children: ExtractChildren<T>
) {
  return () => {
    if (typeof el === 'function') {
      return $$component(el, {
        ...props,
        children,
      });
    }
    return $$el(el, {
      ...props,
      children,
    });
  };
}

export function jsx<T extends Constructor>(
  el: T,
  props: ExtractProps<T>,
) {
  return () => {
    if (typeof el === 'function') {
      return $$component(el, props);
    }
    return $$el(el, props);
  };
}

export { jsx as jsxs, jsx as jsxDEV };

export type Elements = keyof JSX.IntrinsicElements;
export type Constructor =
  | Elements
  | Component<any>
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (string & {});

export type ExtractProps<T extends Constructor> =
  T extends Elements
    ? JSX.IntrinsicElements[T]
    :
  T extends Component<infer U>
    ? U
    : Record<string, unknown>

type OmitAndMerge<A, B> = A & Omit<B, keyof A>;

interface DynamicBaseProps<T extends Constructor> {
  component?: T | null | undefined;
}

export type DynamicProps<T extends Constructor> =
  OmitAndMerge<DynamicBaseProps<T>, ExtractProps<T>>;

export function Dynamic<T extends Constructor>(
  { component, ...props }: DynamicProps<T>,
): JSX.Element {
  if (component) {
    return jsx(component, props as ExtractProps<T>);
  }
  return EMPTY;
}

export type FragmentProps = JSX.StellisFragmentAttributes;

export function Fragment(props: FragmentProps) {
  return $$fragment(props);
}

export type CommentProps = JSX.StellisCommentAttributes;

export function Comment(props: CommentProps) {
  return $$comment(props);
}

export type HeadProps = JSX.StellisHeadAttributes;

export function Head(props: HeadProps) {
  return $$inject('head', props);
}

export type BodyProps = JSX.StellisBodyAttributes;

export function Body(props: HeadProps) {
  return $$inject('body', props);
}

export type ErrorBoundaryProps = JSX.StellisErrorBoundaryAttributes;

export function ErrorBoundary(props: ErrorBoundaryProps): JSX.Element {
  return $$errorBoundary(props);
}
