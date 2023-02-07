import * as babel from '@babel/core';
import * as t from '@babel/types';
import { addNamed } from '@babel/helper-module-imports';
import { Scope } from '@babel/traverse';
import { every, forEach, some } from '../shared/arrays';
import { VOID_ELEMENTS } from '../shared/constants';
import $$attr from '../shared/attr';

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

function isLiteral(node: t.Expression): node is t.Literal {
  if (t.isLiteral(node)) {
    // Check if it is template literal but with only static expressions
    if (t.isTemplateLiteral(node)) {
      return every(node.expressions, (expr) => t.isExpression(expr) && isLiteral(expr));
    }
  }
  return false;
}

function unwrapLiteral(node: t.Literal) {
  if (
    t.isStringLiteral(node)
    || t.isNumericLiteral(node)
    || t.isBooleanLiteral(node)
  ) {
    return node.value;
  }
  if (t.isNullLiteral(node)) {
    return 'null';
  }
  if (t.isBigIntLiteral(node)) {
    return String(BigInt(node.value));
  }
  if (t.isRegExpLiteral(node)) {
    return String(new RegExp(node.pattern, node.flags));
  }
  if (t.isDecimalLiteral(node)) {
    return node.value;
  }
  let result = '';
  forEach(node.quasis, (template, i) => {
    result += template.value.cooked ?? '';
    const expr = node.expressions[i];
    if (t.isLiteral(expr)) {
      result += String(unwrapLiteral(expr));
    }
  });
  return result;
}

function isAwaited(node: t.Expression | t.SpreadElement): boolean {
  // Default
  if (t.isAwaitExpression(node)) {
    return true;
  }
  if (t.isTemplateLiteral(node)) {
    return some(node.expressions, (expr) => t.isExpression(expr) && isAwaited(expr));
  }
  if (
    t.isLiteral(node)
    || t.isIdentifier(node)
    || t.isArrowFunctionExpression(node)
    || t.isFunctionExpression(node)
    || t.isClassExpression(node)
    || t.isYieldExpression(node)
    || t.isJSX(node)
    || t.isMetaProperty(node)
    || t.isSuper(node)
    || t.isThisExpression(node)
    || t.isImport(node)
    || t.isDoExpression(node)
  ) {
    return false;
  }
  if (t.isTaggedTemplateExpression(node)) {
    return isAwaited(node.tag) || isAwaited(node.quasi);
  }
  if (
    t.isUnaryExpression(node)
    || t.isUpdateExpression(node)
    || t.isSpreadElement(node)
  ) {
    return isAwaited(node.argument);
  }
  if (
    t.isParenthesizedExpression(node)
    || t.isTypeCastExpression(node)
    || t.isTSAsExpression(node)
    || t.isTSSatisfiesExpression(node)
    || t.isTSNonNullExpression(node)
    || t.isTSTypeAssertion(node)
    || t.isTSInstantiationExpression(node)
  ) {
    return isAwaited(node.expression);
  }
  // Check for elements
  if (t.isArrayExpression(node) || t.isTupleExpression(node)) {
    return some(node.elements, (el) => el != null && isAwaited(el));
  }
  // Skip arrow function
  if (t.isAssignmentExpression(node)) {
    if (isAwaited(node.right)) {
      return true;
    }
    if (t.isExpression(node.left)) {
      return isAwaited(node.left);
    }
    return false;
  }
  if (t.isBinaryExpression(node)) {
    if (t.isExpression(node.left) && isAwaited(node.left)) {
      return true;
    }
    return isAwaited(node.right);
  }
  if (t.isCallExpression(node) || t.isOptionalCallExpression(node) || t.isNewExpression(node)) {
    if (t.isExpression(node.callee) && isAwaited(node.callee)) {
      return true;
    }
    return some(node.arguments, (arg) => (
      arg && (t.isSpreadElement(arg) || t.isExpression(arg)) && isAwaited(arg)
    ));
  }
  if (t.isConditionalExpression(node)) {
    return isAwaited(node.test)
      || isAwaited(node.consequent)
      || isAwaited(node.alternate);
  }
  if (t.isLogicalExpression(node)) {
    return isAwaited(node.left) || isAwaited(node.right);
  }
  if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
    return isAwaited(node.object)
      || (node.computed && t.isExpression(node.property) && isAwaited(node.property));
  }
  if (t.isSequenceExpression(node)) {
    return some(node.expressions, isAwaited);
  }
  if (t.isObjectExpression(node) || t.isRecordExpression(node)) {
    return some(node.properties, (prop) => {
      if (t.isObjectProperty(prop)) {
        if (t.isExpression(prop.value) && isAwaited(prop.value)) {
          return true;
        }
        if (prop.computed && t.isExpression(prop.key) && isAwaited(prop.key)) {
          return true;
        }
      }
      return false;
    });
  }
  if (t.isBindExpression(node)) {
    return isAwaited(node.object) || isAwaited(node.callee);
  }
  return false;
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

function convertAttributesToObject(
  block: Scope,
  asyncExpression: t.VariableDeclarator[],
  attrs: (t.JSXAttribute | t.JSXSpreadAttribute)[],
) {
  const properties: (t.ObjectProperty | t.SpreadElement | t.ObjectMethod)[] = [];

  forEach(attrs, (attr) => {
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
                  && !t.isJSXEmptyExpression(attr.value.expression)
                ) {
                  collected.content = attr.value.expression;
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
          if (t.isExpression(attr.value.expression) && isLiteral(attr.value.expression)) {
            collected.static.push(attr);
          } else {
            collected.dynamic.push(attr);
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
        && t.isLiteral(attr.value.expression)
      ) {
        attrTemplate += $$attr(getTagName(attr.name), unwrapLiteral(attr.value.expression)).t;
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
          classList.push(t.logicalExpression('&&', valueID, className));
        } else {
          classList.push(t.logicalExpression('&&', attr.value.expression, className));
        }
      } else {
        classList.push(className);
      }
    } else if (attr.value) {
      if (t.isStringLiteral(attr.value)) {
        classList.push(attr.value);
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
          classList.push(valueID);
        } else {
          classList.push(attr.value.expression);
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
          styles.push(t.objectExpression([
            t.objectProperty(className, valueID),
          ]));
        } else {
          styles.push(t.objectExpression([
            t.objectProperty(className, attr.value.expression),
          ]));
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
      }
    }
  });

  return htmlArgs;
}

function finalizeNode(
  ctx: StateContext,
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
  // Convert name to string
  const tagName = getTagName(name);

  const shouldSkipChildren = VOID_ELEMENTS.test(tagName);

  const program = path.scope.getProgramParent();
  const block = path.scope.getBlockParent();

  const asyncExpression: t.VariableDeclarator[] = [];

  let htmlResult: t.Expression | undefined;

  // Check if node has prop spreading
  if (hasPropSpreading(path.node)) {
    const properties = convertAttributesToObject(
      block,
      asyncExpression,
      path.node.openingElement.attributes,
    );

    if (path.node.children.length) {
      properties.push(
        t.objectProperty(
          t.identifier('children'),
          t.arrowFunctionExpression([], t.jsxFragment(
            t.jsxOpeningFragment(),
            t.jsxClosingFragment(),
            path.node.children,
          )),
        ),
      );
    }

    htmlResult = t.callExpression(
      getImportIdentifier(ctx, path, IMPORTS.el),
      [
        t.stringLiteral(tagName),
        t.arrowFunctionExpression([], t.objectExpression(properties)),
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
        htmlArgs.push(t.arrowFunctionExpression([], collected.content));
      } else {
        htmlArgs.push(t.arrowFunctionExpression([], t.jsxFragment(
          t.jsxOpeningFragment(),
          t.jsxClosingFragment(),
          path.node.children,
        )));
      }
      template.push(t.stringLiteral(`</${tagName}>`));
    }

    // Push template
    program.push({
      id: templateID,
      kind: 'const',
      init: t.arrayExpression(template),
    });

    htmlResult = t.callExpression(
      getImportIdentifier(ctx, path, IMPORTS.html),
      [templateID, ...htmlArgs],
    );
  }

  finalizeNode(ctx, path, asyncExpression, htmlResult);
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
    path.node.openingElement.attributes,
  );

  if (path.node.children.length) {
    properties.push(
      t.objectProperty(
        t.identifier('children'),
        t.arrowFunctionExpression([], t.jsxFragment(
          t.jsxOpeningFragment(),
          t.jsxClosingFragment(),
          path.node.children,
        )),
      ),
    );
  }

  finalizeNode(ctx, path, asyncExpression, t.callExpression(
    getImportIdentifier(ctx, path, IMPORTS.component),
    [
      identifier,
      t.arrowFunctionExpression([], t.objectExpression(properties)),
    ],
  ));
}

function createFragment(
  path: babel.NodePath<t.JSXFragment>,
) {
  const children: t.Expression[] = [];

  forEach(path.node.children, (child) => {
    if (t.isJSXElement(child) || t.isJSXFragment(child)) {
      children.push(child);
    } else if (t.isJSXExpressionContainer(child)) {
      if (t.isExpression(child.expression)) {
        if (isAwaited(child.expression)) {
          const id = t.identifier('v');
          children.push(
            t.arrowFunctionExpression(
              [id],
              t.sequenceExpression([
                t.assignmentExpression('=', id, child.expression),
                id,
              ]),
              true,
            ),
          );
        } else {
          children.push(child.expression);
        }
      }
    } else if (t.isJSXSpreadChild(child)) {
      if (isAwaited(child.expression)) {
        const id = t.identifier('v');
        children.push(
          t.arrowFunctionExpression(
            [id],
            t.sequenceExpression([
              t.assignmentExpression('=', id, child.expression),
              id,
            ]),
          ),
        );
      } else {
        children.push(child.expression);
      }
    } else {
      children.push(t.stringLiteral(child.value));
    }
  });

  if (children.length === 1) {
    path.replaceWith(children[0]);
  } else {
    path.replaceWith(t.arrayExpression(children));
  }
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
