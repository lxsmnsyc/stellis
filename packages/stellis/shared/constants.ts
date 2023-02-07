export const VOID_ELEMENTS = /^(?:area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr)$/i;

export const CHILDREN_KEY = 'children';
export const SET_HTML_KEY = 'set:html';

export const BOOLEANISH_PROPS = new Set([
  'contenteditable',
  'draggable',
  'spellcheck',
  'value',
  'autoReverse',
  'externalResourcesRequired',
  'focusable',
  'preserveAlpha',
]);

export const BOOLEAN_PROPS = new Set([
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'disabled',
  'formnovalidate',
  'hidden',
  'indeterminate',
  'ismap',
  'itemscope',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'seamless',
  'selected',
]);

export const OVERLOADED_BOOLEAN_PROPS = new Set([
  'capture',
  'download',
]);

export const POSITIVE_NUMERIC_PROPS = new Set([
  'cols',
  'rows',
  'size',
  'span',
]);

export const NUMERIC_PROPS = new Set([
  'rowspan',
  'start',
]);
