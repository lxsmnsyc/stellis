import * as babel from '@babel/core';
import * as t from '@babel/types';
import { addNamed } from '@babel/helper-module-imports';
import { Scope } from '@babel/traverse';
import { forEach, some } from '../shared/arrays';
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

function hasPropSpreading(node: t.JSXElement) {
  const { attributes } = node.openingElement;
  return some(attributes, (attr) => t.isJSXSpreadAttribute(attr));
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

  forEach(children, (child) => {
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
  });

  if (sequence) {
    resolved.push(t.stringLiteral(sequence));
  }

  return resolved;
}

function generateChildren(
  children: (t.JSXElement | t.JSXFragment)['children'],
) {
  const resolvedChildren: t.Expression[] = [];

  const wrapper = t.jsxFragment(
    t.jsxOpeningFragment(),
    t.jsxClosingFragment(),
    children,
  );

  forEach(t.react.buildChildren(wrapper), (child) => {
    if (t.isJSXElement(child)) {
      resolvedChildren.push(child);
    } else if (t.isJSXFragment(child)) {
      resolvedChildren.push(generateChildren(child.children));
    } else if (t.isExpression(child)) {
      if (isAwaited(child)) {
        const id = t.identifier('v');
        resolvedChildren.push(
          t.arrowFunctionExpression(
            [id],
            t.sequenceExpression([
              t.assignmentExpression('=', id, child),
              id,
            ]),
            true,
          ),
        );
      } else {
        resolvedChildren.push(child);
      }
    } else if (isAwaited(child.expression)) {
      const id = t.identifier('v');
      resolvedChildren.push(
        t.arrowFunctionExpression(
          [id],
          t.sequenceExpression([
            t.assignmentExpression('=', id, child.expression),
            id,
          ]),
        ),
      );
    } else {
      resolvedChildren.push(child.expression);
    }
  });

  const optimized = optimizeChildren(resolvedChildren);

  const result = resolvedChildren.length === 1
    ? optimized[0]
    : t.arrayExpression(optimized);

  if (isStatic(result)) {
    return result;
  }
  return t.arrowFunctionExpression([], result);
}

function convertAttributesToObject(
  block: Scope,
  asyncExpression: t.VariableDeclarator[],
  el: t.JSXElement,
) {
  const properties: (t.ObjectProperty | t.SpreadElement | t.ObjectMethod)[] = [];

  forEach(el.openingElement.attributes, (attr) => {
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
        if (isAwaited(expr)) {
          const valueID = block.generateUidIdentifier('v');
          asyncExpression.push(t.variableDeclarator(
            valueID,
            expr,
          ));
          properties.push(t.objectProperty(t.stringLiteral(attrName), valueID));
        } else {
          properties.push(t.objectProperty(t.stringLiteral(attrName), expr));
        }
      }
    }
  });

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

function collectAttributes(attributes: (t.JSXAttribute | t.JSXSpreadAttribute)[]) {
  const collected: CollectedAttributes = {
    // Separate static and dynamic attributes
    static: [],
    dynamic: [],
    // Merge all classes and styles
    class: [],
    style: [],
  };

  forEach(attributes, (attr) => {
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
  });

  return collected;
}

function serializeStaticAttributes(attributes: t.JSXAttribute[]) {
  let attrTemplate = '';
  forEach(attributes, (attr) => {
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
  });
  return attrTemplate;
}

function serializeClassList(
  block: Scope,
  asyncExpression: t.VariableDeclarator[],
  attributes: t.JSXAttribute[],
) {
  const classList: t.Expression[] = [];
  // Solve class
  forEach(attributes, (attr) => {
    if (t.isJSXNamespacedName(attr.name)) {
      const className = t.stringLiteral(attr.name.name.name);
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
  });
  return classList;
}

function serializeStyles(
  block: Scope,
  asyncExpression: t.VariableDeclarator[],
  attributes: t.JSXAttribute[],
) {
  const styles: t.Expression[] = [];
  // Solve styles
  forEach(attributes, (attr) => {
    if (t.isJSXNamespacedName(attr.name)) {
      const className = t.stringLiteral(attr.name.name.name);
      if (t.isStringLiteral(attr.value)) {
        styles.push(t.objectExpression([
          t.objectProperty(className, attr.value),
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
              t.objectProperty(className, valueID),
            ]));
          } else {
            styles.push(t.objectExpression([
              t.objectProperty(className, attr.value.expression),
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
  });
  return styles;
}

function serializeHTMLArguments(
  ctx: StateContext,
  path: babel.NodePath<t.JSXElement>,
  block: Scope,
  asyncExpression: t.VariableDeclarator[],
  attributes: t.JSXAttribute[],
) {
  const htmlArgs: t.Expression[] = [];

  const attrFn = getImportIdentifier(ctx, path, IMPORTS.attr);
  // Solve class
  forEach(attributes, (attr) => {
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
  });

  return htmlArgs;
}

function finalizeNode(
  path: babel.NodePath<t.JSXElement>,
  asyncExpression: t.VariableDeclarator[],
  result: t.Expression,
) {
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

function createElement(
  ctx: StateContext,
  path: babel.NodePath<t.JSXElement>,
  name: t.JSXIdentifier | t.JSXNamespacedName,
) {
  const program = path.scope.getProgramParent();
  const block = path.scope.getBlockParent();

  const asyncExpression: t.VariableDeclarator[] = [];
  let htmlResult: t.Expression | undefined;

  if (t.isJSXNamespacedName(name) && name.namespace.name === 'stellis') {
    if (name.name.name === 'head' || name.name.name === 'body') {
      const properties = convertAttributesToObject(
        block,
        asyncExpression,
        path.node,
      );

      htmlResult = t.callExpression(
        getImportIdentifier(ctx, path, IMPORTS.inject),
        [
          t.stringLiteral(name.name.name),
          t.objectExpression(properties),
        ],
      );
    } else {
      htmlResult = generateChildren(path.node.children);
    }
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

      forEach(htmlArgs, (_, i) => {
        if (i < htmlArgs.length - 1) {
          template.push(t.stringLiteral(''));
        }
      });

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
        init: t.arrayExpression(template),
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
) {
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
) {
  path.replaceWith(generateChildren(path.node.children));
}

interface State extends babel.PluginPass {
  ctx: StateContext;
}

export default function solidStyledPlugin(): babel.PluginObj<State> {
  return {
    name: 'stellis',
    pre() {
      this.ctx = {
        hooks: new Map(),
      };
    },
    visitor: {
      JSXElement(path, { ctx }) {
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
      JSXFragment(path) {
        createFragment(path);
      },
    },
  };
}
