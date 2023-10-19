import type * as babel from '@babel/core';
import * as t from '@babel/types';
import { addNamed } from '@babel/helper-module-imports';
import type { Scope } from '@babel/traverse';
import { VOID_ELEMENTS } from '../shared/constants';
import $$attr from '../shared/attr';
import {
  isAwaited,
  isGuaranteedLiteral,
  isStatic,
  serializeLiteral,
  unwrapLiteral,
} from './expr-check';
import $$escape from '../shared/escape-string';

// The module
const SOURCE_MODULE = 'stellis';

// imports
const IMPORTS = {
  node: '$$node',
  component: '$$component',
  html: '$$html',
  attr: '$$attr',
  escape: '$$escape',
  class: '$$class',
  style: '$$style',
  el: '$$el',
  inject: '$$inject',
  errorBoundary: '$$errorBoundary',
  comment: '$$comment',
  fragment: '$$fragment',
};

interface StateContext {
  hooks: Map<string, t.Identifier>;
}

function getImportIdentifier(
  ctx: StateContext,
  path: babel.NodePath,
  name: string,
  source = SOURCE_MODULE,
): t.Identifier {
  const current = ctx.hooks.get(name);
  if (current) {
    return current;
  }
  const newID = addNamed(path, name, source);
  ctx.hooks.set(name, newID);
  return newID;
}

function hasPropSpreading(node: t.JSXElement): boolean {
  const { attributes } = node.openingElement;
  for (let i = 0, len = attributes.length; i < len; i++) {
    if (t.isJSXSpreadAttribute(attributes[i])) {
      return true;
    }
  }
  return false;
}

function getTagName(name: t.JSXIdentifier | t.JSXNamespacedName): string {
  if (t.isJSXIdentifier(name)) {
    return name.name;
  }
  return `${name.namespace.name}:${name.name.name}`;
}

function optimizeChildren(
  children: t.Expression[],
): t.Expression[] {
  const resolved: t.Expression[] = [];

  let sequence: string | undefined;

  let child: t.Expression;
  for (let i = 0, len = children.length; i < len; i++) {
    child = children[i];
    if (isGuaranteedLiteral(child)) {
      const result = serializeLiteral(child);
      if (sequence) {
        sequence += result;
      } else {
        sequence = result;
      }
    } else {
      if (sequence) {
        resolved.push(t.stringLiteral(sequence));
        sequence = undefined;
      }
      resolved.push(child);
    }
  }

  if (sequence) {
    resolved.push(t.stringLiteral(sequence));
  }

  return resolved;
}

function generateChildren(
  children: (t.JSXElement | t.JSXFragment)['children'],
): t.Expression {
  const resolvedChildren: t.Expression[] = [];

  const wrapper = t.jsxFragment(
    t.jsxOpeningFragment(),
    t.jsxClosingFragment(),
    children,
  );

  const wrappedChildren = t.react.buildChildren(wrapper);

  for (let i = 0, len = wrappedChildren.length; i < len; i++) {
    const child = wrappedChildren[i];
    if (t.isJSXElement(child)) {
      resolvedChildren.push(child);
    } else if (t.isJSXFragment(child)) {
      resolvedChildren.push(generateChildren(child.children));
    } else if (t.isExpression(child)) {
      if (isAwaited(child)) {
        resolvedChildren.push(
          t.arrowFunctionExpression(
            [],
            child,
            true,
          ),
        );
      } else {
        resolvedChildren.push(child);
      }
    } else if (isAwaited(child.expression)) {
      resolvedChildren.push(
        t.arrowFunctionExpression(
          [],
          child.expression,
        ),
      );
    } else {
      resolvedChildren.push(child.expression);
    }
  }

  const optimized = optimizeChildren(resolvedChildren);

  const result = resolvedChildren.length === 1
    ? optimized[0]
    : t.arrayExpression(optimized);

  if (isStatic(result)) {
    return result;
  }
  return t.arrowFunctionExpression([], result);
}

// Test if key is a valid number or JS identifier
// so that we don't have to serialize the key and wrap with brackets
function isIdentifierString(str: string): boolean {
  const check = Number(str);

  return (
    check >= 0
    || (Number.isNaN(check) && /^([$A-Z_][0-9A-Z_$]*)$/i.test(str))
  );
}

function convertAttributesToObject(
  block: Scope,
  asyncExpression: t.VariableDeclarator[],
  el: t.JSXElement,
): (t.ObjectMethod | t.ObjectProperty | t.SpreadElement)[] {
  const properties: (t.ObjectProperty | t.SpreadElement | t.ObjectMethod)[] = [];

  for (let i = 0, len = el.openingElement.attributes.length; i < len; i++) {
    const attr = el.openingElement.attributes[i];
    if (t.isJSXSpreadAttribute(attr)) {
      if (isAwaited(attr.argument)) {
        const valueID = block.generateUidIdentifier('v');
        asyncExpression.push(t.variableDeclarator(
          valueID,
          attr.argument,
        ));
        properties.push(t.spreadElement(valueID));
      } else {
        properties.push(t.spreadElement(attr.argument));
      }
    } else {
      const attrName = getTagName(attr.name);
      let expr: t.Expression | undefined;
      if (
        t.isJSXElement(attr.value)
        || t.isJSXFragment(attr.value)
        || t.isStringLiteral(attr.value)
      ) {
        expr = attr.value;
      } else if (
        t.isJSXExpressionContainer(attr.value)
        && t.isExpression(attr.value.expression)
      ) {
        expr = attr.value.expression;
      }
      if (expr) {
        const attrID = isIdentifierString(attrName)
          ? t.identifier(attrName)
          : t.stringLiteral(attrName);

        if (isAwaited(expr)) {
          const valueID = block.generateUidIdentifier('v');
          asyncExpression.push(t.variableDeclarator(
            valueID,
            expr,
          ));
          properties.push(t.objectProperty(attrID, valueID));
        } else {
          properties.push(t.objectProperty(attrID, expr));
        }
      }
    }
  }

  if (el.children.length) {
    properties.push(
      t.objectProperty(
        t.identifier('children'),
        generateChildren(el.children),
      ),
    );
  }

  return properties;
}

interface CollectedAttributes {
  static: t.JSXAttribute[];
  dynamic: t.JSXAttribute[];
  class: t.JSXAttribute[];
  style: t.JSXAttribute[];
  content?: t.Expression;
}

function collectAttributes(
  attributes: (t.JSXAttribute | t.JSXSpreadAttribute)[],
): CollectedAttributes {
  const collected: CollectedAttributes = {
    // Separate static and dynamic attributes
    static: [],
    dynamic: [],
    // Merge all classes and styles
    class: [],
    style: [],
  };

  for (let i = 0, len = attributes.length; i < len; i++) {
    const attr = attributes[i];
    if (t.isJSXAttribute(attr)) {
      if (t.isJSXNamespacedName(attr.name)) {
        switch (attr.name.namespace.name) {
          case 'class':
            collected.class.push(attr);
            break;
          case 'style':
            collected.style.push(attr);
            break;
          case 'set':
            switch (attr.name.name.name) {
              // Might add more
              case 'html':
                if (t.isStringLiteral(attr.value)) {
                  collected.content = attr.value;
                } else if (
                  t.isJSXExpressionContainer(attr.value)
                ) {
                  if (t.isJSXEmptyExpression(attr.value.expression)) {
                    collected.content = t.stringLiteral('');
                  } else {
                    collected.content = attr.value.expression;
                  }
                }
                break;
              default:
                break;
            }
            break;
          default:
            break;
        }
      } else if (attr.name.name === 'class') {
        collected.class.push(attr);
      } else if (attr.name.name === 'style') {
        collected.style.push(attr);
      } else if (attr.value) {
        if (t.isStringLiteral(attr.value)) {
          collected.static.push(attr);
        } else if (t.isJSXExpressionContainer(attr.value)) {
          if (t.isExpression(attr.value.expression)) {
            if (isGuaranteedLiteral(attr.value.expression)) {
              collected.static.push(attr);
            } else {
              collected.dynamic.push(attr);
            }
          } else {
            collected.static.push(attr);
          }
        }
      } else {
        collected.static.push(attr);
      }
    }
  }

  return collected;
}

function serializeStaticAttributes(attributes: t.JSXAttribute[]): string {
  let attrTemplate = '';
  for (let i = 0, len = attributes.length; i < len; i++) {
    const attr = attributes[i];
    if (attr.value) {
      if (t.isStringLiteral(attr.value)) {
        attrTemplate += $$attr(getTagName(attr.name), unwrapLiteral(attr.value)).t;
      } else if (
        t.isJSXExpressionContainer(attr.value)
      ) {
        if (t.isLiteral(attr.value.expression)) {
          attrTemplate += $$attr(getTagName(attr.name), unwrapLiteral(attr.value.expression)).t;
        } else {
          attrTemplate += $$attr(getTagName(attr.name), true).t;
        }
      }
    } else {
      attrTemplate += $$attr(getTagName(attr.name), true).t;
    }
  }
  return attrTemplate;
}

function serializeClassList(
  block: Scope,
  asyncExpression: t.VariableDeclarator[],
  attributes: t.JSXAttribute[],
): t.Expression[] {
  const classList: t.Expression[] = [];
  // Solve class
  for (let i = 0, len = attributes.length; i < len; i++) {
    const attr = attributes[i];
    if (t.isJSXNamespacedName(attr.name)) {
      const attrName = attr.name.name.name;
      const className = t.stringLiteral(attrName);
      if (t.isStringLiteral(attr.value)) {
        classList.push(t.logicalExpression('&&', attr.value, className));
      } else if (
        t.isJSXExpressionContainer(attr.value)
      ) {
        if (t.isExpression(attr.value.expression)) {
          // Check if the value is awaited
          if (isAwaited(attr.value.expression)) {
            // Move the value up the scope and use the given identifier instead
            const valueID = block.generateUidIdentifier('v');
            asyncExpression.push(t.variableDeclarator(
              valueID,
              attr.value.expression,
            ));
            classList.push(t.logicalExpression('&&', valueID, className));
          } else {
            classList.push(t.logicalExpression('&&', attr.value.expression, className));
          }
        } else {
          classList.push(className);
        }
      } else {
        classList.push(className);
      }
    } else if (attr.value) {
      if (t.isStringLiteral(attr.value)) {
        classList.push(attr.value);
      } else if (
        t.isJSXExpressionContainer(attr.value)
      ) {
        if (t.isExpression(attr.value.expression)) {
          // Check if the value is awaited
          if (isAwaited(attr.value.expression)) {
            // Move the value up the scope and use the given identifier instead
            const valueID = block.generateUidIdentifier('v');
            asyncExpression.push(t.variableDeclarator(
              valueID,
              attr.value.expression,
            ));
            classList.push(valueID);
          } else {
            classList.push(attr.value.expression);
          }
        } else {
          classList.push(t.stringLiteral(''));
        }
      }
    }
  }
  return classList;
}

function serializeStyles(
  block: Scope,
  asyncExpression: t.VariableDeclarator[],
  attributes: t.JSXAttribute[],
): t.Expression[] {
  const styles: t.Expression[] = [];
  // Solve styles
  for (let i = 0, len = attributes.length; i < len; i++) {
    const attr = attributes[i];
    if (t.isJSXNamespacedName(attr.name)) {
      const attrName = attr.name.name.name;
      const styleName = isIdentifierString(attrName)
        ? t.identifier(attrName)
        : t.stringLiteral(attrName);
      if (t.isStringLiteral(attr.value)) {
        styles.push(t.objectExpression([
          t.objectProperty(styleName, attr.value),
        ]));
      } else if (
        t.isJSXExpressionContainer(attr.value)
      ) {
        if (t.isExpression(attr.value.expression)) {
          // Check if the value is awaited
          if (isAwaited(attr.value.expression)) {
            // Move the value up the scope and use the given identifier instead
            const valueID = block.generateUidIdentifier('v');
            asyncExpression.push(t.variableDeclarator(
              valueID,
              attr.value.expression,
            ));
            styles.push(t.objectExpression([
              t.objectProperty(styleName, valueID),
            ]));
          } else {
            styles.push(t.objectExpression([
              t.objectProperty(styleName, attr.value.expression),
            ]));
          }
        }
      }
    } else if (attr.value) {
      if (t.isStringLiteral(attr.value)) {
        styles.push(attr.value);
      } else if (
        t.isJSXExpressionContainer(attr.value)
        && t.isExpression(attr.value.expression)
      ) {
        // Check if the value is awaited
        if (isAwaited(attr.value.expression)) {
          // Move the value up the scope and use the given identifier instead
          const valueID = block.generateUidIdentifier('v');
          asyncExpression.push(t.variableDeclarator(
            valueID,
            attr.value.expression,
          ));
          styles.push(valueID);
        } else {
          styles.push(attr.value.expression);
        }
      }
    }
  }
  return styles;
}

function serializeHTMLArguments(
  ctx: StateContext,
  path: babel.NodePath<t.JSXElement>,
  block: Scope,
  asyncExpression: t.VariableDeclarator[],
  attributes: t.JSXAttribute[],
): t.Expression[] {
  const htmlArgs: t.Expression[] = [];

  if (attributes.length) {
    const attrFn = getImportIdentifier(ctx, path, IMPORTS.attr);
    // Solve class
    for (let i = 0, len = attributes.length; i < len; i++) {
      const attr = attributes[i];
      const attrName = t.stringLiteral(getTagName(attr.name));
      if (attr.value) {
        if (t.isStringLiteral(attr.value)) {
          htmlArgs.push(t.callExpression(
            attrFn,
            [attrName, attr.value],
          ));
        } else if (
          t.isJSXExpressionContainer(attr.value)
        ) {
          if (t.isExpression(attr.value.expression)) {
            // Check if the value is awaited
            if (isAwaited(attr.value.expression)) {
              // Move the value up the scope and use the given identifier instead
              const valueID = block.generateUidIdentifier('v');
              asyncExpression.push(t.variableDeclarator(
                valueID,
                attr.value.expression,
              ));
              htmlArgs.push(t.callExpression(
                attrFn,
                [attrName, valueID],
              ));
            } else {
              htmlArgs.push(t.callExpression(
                attrFn,
                [attrName, attr.value.expression],
              ));
            }
          } else {
            htmlArgs.push(t.callExpression(
              attrFn,
              [attrName, t.booleanLiteral(true)],
            ));
          }
        }
      }
    }
  }

  return htmlArgs;
}

function finalizeNode(
  path: babel.NodePath<t.JSXElement>,
  asyncExpression: t.VariableDeclarator[],
  result: t.Expression,
): void {
  if (asyncExpression.length) {
    path.replaceWith(t.arrowFunctionExpression(
      [],
      t.blockStatement([
        t.variableDeclaration('const', asyncExpression),
        t.returnStatement(result),
      ]),
      true,
    ));
  } else {
    path.replaceWith(result);
  }
}

function createBuiltinComponent(
  ctx: StateContext,
  path: babel.NodePath<t.JSXElement>,
  name: t.JSXNamespacedName,
  block: Scope,
  asyncExpression: t.VariableDeclarator[],
): t.Expression {
  switch (name.name.name) {
    case 'head':
    case 'body':
      return t.callExpression(
        getImportIdentifier(ctx, path, IMPORTS.inject),
        [
          t.stringLiteral(name.name.name),
          t.objectExpression(
            convertAttributesToObject(
              block,
              asyncExpression,
              path.node,
            ),
          ),
        ],
      );
    case 'error-boundary':
      return t.callExpression(
        getImportIdentifier(ctx, path, IMPORTS.errorBoundary),
        [
          t.objectExpression(
            convertAttributesToObject(
              block,
              asyncExpression,
              path.node,
            ),
          ),
        ],
      );
    case 'fragment':
      return t.callExpression(
        getImportIdentifier(ctx, path, IMPORTS.fragment),
        [
          t.objectExpression(
            convertAttributesToObject(
              block,
              asyncExpression,
              path.node,
            ),
          ),
        ],
      );
    case 'comment':
      return t.callExpression(
        getImportIdentifier(ctx, path, IMPORTS.comment),
        [
          t.objectExpression(
            convertAttributesToObject(
              block,
              asyncExpression,
              path.node,
            ),
          ),
        ],
      );
    default:
      return generateChildren(path.node.children);
  }
}

function createElement(
  ctx: StateContext,
  path: babel.NodePath<t.JSXElement>,
  name: t.JSXIdentifier | t.JSXNamespacedName,
): void {
  const program = path.scope.getProgramParent();
  const block = path.scope.getBlockParent();

  const asyncExpression: t.VariableDeclarator[] = [];
  let htmlResult: t.Expression | undefined;

  if (t.isJSXNamespacedName(name) && name.namespace.name === 'stellis') {
    htmlResult = createBuiltinComponent(ctx, path, name, block, asyncExpression);
  } else {
    // Convert name to string
    const tagName = getTagName(name);

    const shouldSkipChildren = VOID_ELEMENTS.test(tagName);

    // Check if node has prop spreading
    if (hasPropSpreading(path.node)) {
      const properties = convertAttributesToObject(
        block,
        asyncExpression,
        path.node,
      );

      htmlResult = t.callExpression(
        getImportIdentifier(ctx, path, IMPORTS.el),
        [
          t.stringLiteral(tagName),
          t.objectExpression(properties),
        ],
      );
    } else {
      const templateID = program.generateUidIdentifier('template');

      // Solve the template
      let prefix = `<${tagName}`;
      const collected = collectAttributes(path.node.openingElement.attributes);
      const attrTemplate = serializeStaticAttributes(collected.static);
      const htmlArgs = serializeHTMLArguments(ctx, path, block, asyncExpression, collected.dynamic);
      const classList = serializeClassList(block, asyncExpression, collected.class);
      const styles = serializeStyles(block, asyncExpression, collected.style);
      const shouldEscape = t.booleanLiteral(true);

      if (classList.length) {
        htmlArgs.push(t.callExpression(
          getImportIdentifier(ctx, path, IMPORTS.class),
          classList,
        ));
      }
      if (styles.length) {
        htmlArgs.push(t.callExpression(
          getImportIdentifier(ctx, path, IMPORTS.style),
          styles,
        ));
      }

      if (attrTemplate !== '') {
        prefix += ` ${attrTemplate}`;
      } else if (htmlArgs.length) {
        prefix += ' ';
      }

      const template = [t.stringLiteral(prefix)];

      for (let i = 0, len = htmlArgs.length; i < len; i++) {
        if (i < htmlArgs.length - 1) {
          template.push(t.stringLiteral(''));
        }
      }

      if (shouldSkipChildren) {
        if (htmlArgs.length) {
          template.push(t.stringLiteral('/>'));
        } else {
          template[0].value += '/>';
        }
      } else {
        if (htmlArgs.length) {
          template.push(t.stringLiteral('>'));
        } else {
          template[0].value += '>';
        }
        if (collected.content) {
          if (isGuaranteedLiteral(collected.content)) {
            template[template.length - 1].value += `${serializeLiteral(collected.content)}</${tagName}>`;
          } else {
            htmlArgs.push(t.arrowFunctionExpression([], collected.content));
            template.push(t.stringLiteral(`</${tagName}>`));
          }
          shouldEscape.value = false;
        } else {
          const children = generateChildren(path.node.children);
          if (isGuaranteedLiteral(children)) {
            template[template.length - 1].value += `${$$escape(serializeLiteral(children))}</${tagName}>`;
          } else {
            htmlArgs.push(children);
            template.push(t.stringLiteral(`</${tagName}>`));
          }
        }
      }

      // Push template
      program.push({
        id: templateID,
        kind: 'const',
        init: template.length === 1 ? template[0] : t.arrayExpression(template),
      });

      htmlResult = t.callExpression(
        getImportIdentifier(ctx, path, IMPORTS.html),
        [templateID, shouldEscape, ...htmlArgs],
      );
    }
  }
  finalizeNode(path, asyncExpression, htmlResult);
}

function getComponentIdentifier(name: t.JSXIdentifier | t.JSXMemberExpression): t.Expression {
  if (t.isJSXIdentifier(name)) {
    return t.identifier(name.name);
  }
  const object = getComponentIdentifier(name.object);
  const property = t.identifier(name.property.name);
  return t.memberExpression(object, property);
}

function createComponent(
  ctx: StateContext,
  path: babel.NodePath<t.JSXElement>,
  name: t.JSXIdentifier | t.JSXMemberExpression,
): void {
  const identifier = getComponentIdentifier(name);

  const block = path.scope.getBlockParent();

  const asyncExpression: t.VariableDeclarator[] = [];

  const properties = convertAttributesToObject(
    block,
    asyncExpression,
    path.node,
  );

  finalizeNode(path, asyncExpression, t.callExpression(
    getImportIdentifier(ctx, path, IMPORTS.component),
    [
      identifier,
      t.objectExpression(properties),
    ],
  ));
}

function createFragment(
  path: babel.NodePath<t.JSXFragment>,
): void {
  path.replaceWith(generateChildren(path.node.children));
}

interface State extends babel.PluginPass {
  ctx: StateContext;
}

export default function solidStyledPlugin(): babel.PluginObj<State> {
  return {
    name: 'stellis',
    pre(): void {
      this.ctx = {
        hooks: new Map(),
      };
    },
    visitor: {
      JSXElement(path, { ctx }): void {
        const { node } = path;
        if (t.isJSXIdentifier(node.openingElement.name)) {
          // Check if identifier matches an html element
          if (/^[A-Z]/.test(node.openingElement.name.name)) {
            createComponent(ctx, path, node.openingElement.name);
          } else {
            createElement(ctx, path, node.openingElement.name);
          }
        } else if (t.isJSXMemberExpression(node.openingElement.name)) {
          createComponent(ctx, path, node.openingElement.name);
        } else if (t.isJSXNamespacedName(node.openingElement.name)) {
          createElement(ctx, path, node.openingElement.name);
        }
      },
      JSXFragment(path): void {
        createFragment(path);
      },
    },
  };
}
