/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable eqeqeq */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-bitwise */
import * as t from '@babel/types';
import assert from '../shared/assert';
import { Serializable } from '../shared/attr';

export function unwrapLiteral(node: t.Expression): Serializable {
  switch (node.type) {
    case 'ParenthesizedExpression':
    case 'TypeCastExpression':
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
    case 'TSNonNullExpression':
    case 'TSTypeAssertion':
    case 'TSInstantiationExpression':
      return unwrapLiteral(node.expression);
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
      return node.value;
    case 'NullLiteral':
      return null;
    case 'Identifier':
      switch (node.name) {
        case 'undefined': return undefined;
        case 'NaN': return NaN;
        case 'Infinity': return Infinity;
        default: throw new Error('Illegal identifier');
      }
    case 'BigIntLiteral':
      return BigInt(node.value);
    case 'RegExpLiteral':
      return new RegExp(node.pattern, node.flags);
    case 'DecimalLiteral':
      return node.value;
    case 'TemplateLiteral': {
      let result = '';
      for (let i = 0, len = node.quasis.length; i < len; i++) {
        result += node.quasis[i].value.cooked || '';
        const expr = node.expressions[i];
        if (t.isLiteral(expr)) {
          result += String(unwrapLiteral(expr));
        }
      }
      return result;
    }
    case 'UnaryExpression': {
      if (node.operator === 'void') {
        return undefined;
      }
      const argument = unwrapLiteral(node.argument);
      switch (node.operator) {
        case '!': return !argument;
        case '+': return +(argument as any);
        case '-': return -(argument as any);
        case 'typeof': return typeof argument;
        case '~': return argument;
        default:
          throw new Error('Unexpected unary expression during literal unwrap');
      }
    }
    case 'ConditionalExpression': {
      return unwrapLiteral(node.test)
        ? unwrapLiteral(node.consequent)
        : unwrapLiteral(node.alternate);
    }
    case 'BinaryExpression': {
      assert(!t.isPrivateName(node.left), new Error('Unexpected private name on BinaryExpression'));
      const left = unwrapLiteral(node.left) as any;
      const right = unwrapLiteral(node.right) as any;
      switch (node.operator) {
        case '!=': return left != right;
        case '!==': return left !== right;
        case '%': return left % right;
        case '&': return left & right;
        case '*': return left * right;
        case '**': return left ** right;
        case '+': return left + right;
        case '-': return left - right;
        case '/': return left / right;
        case '<': return left < right;
        case '<<': return left << right;
        case '<=': return left <= right;
        case '==': return left == right;
        case '===': return left === right;
        case '>': return left > right;
        case '>=': return left >= right;
        case '>>': return left >> right;
        case '>>>': return left >>> right;
        case '^': return left ^ right;
        case '|': return left | right;
        default:
          throw new Error('Unexpected BinaryExpression during literal unwrap');
      }
    }
    case 'LogicalExpression': {
      const left = unwrapLiteral(node.left) as any;
      const right = unwrapLiteral(node.right) as any;
      switch (node.operator) {
        case '&&': return left && right;
        case '??': return left ?? right;
        case '||': return left || right;
        default: return undefined;
      }
    }
    default:
      throw new Error('Attempted to unwrap a non-guaranteed literal');
  }
}

export function serializeLiteral(node: t.Expression): string {
  const unwrapped = unwrapLiteral(node);
  if (
    unwrapped == null
    || unwrapped === true
    || unwrapped === false
  ) {
    return '';
  }
  if (typeof unwrapped === 'number' || typeof unwrapped === 'bigint') {
    return `${unwrapped}`;
  }
  if (typeof unwrapped === 'string') {
    return unwrapped;
  }
  return String(unwrapped);
}

export function isGuaranteedLiteral(node: t.Expression): node is t.Literal {
  switch (node.type) {
    case 'ParenthesizedExpression':
    case 'TypeCastExpression':
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
    case 'TSNonNullExpression':
    case 'TSTypeAssertion':
    case 'TSInstantiationExpression':
      return isGuaranteedLiteral(node.expression);
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
    case 'NullLiteral':
    case 'BigIntLiteral':
    case 'RegExpLiteral':
      return true;
    case 'Identifier':
      switch (node.name) {
        case 'undefined': return true;
        case 'NaN': return true;
        case 'Infinity': return true;
        default: return false;
      }
    case 'TemplateLiteral':
      for (let i = 0, len = node.expressions.length; i < len; i++) {
        const expr = node.expressions[i];
        if (t.isExpression(expr) && !isGuaranteedLiteral(expr)) {
          return false;
        }
      }
      return true;
    case 'UnaryExpression':
      if (node.operator === 'throw' || node.operator === 'delete') {
        return false;
      }
      return isGuaranteedLiteral(node.argument);
    case 'ConditionalExpression':
      return isGuaranteedLiteral(node.test)
        || isGuaranteedLiteral(node.consequent)
        || isGuaranteedLiteral(node.alternate);
    case 'BinaryExpression':
      if (node.operator === 'in' || node.operator === 'instanceof' || node.operator === '|>') {
        return false;
      }
      if (t.isExpression(node.left)) {
        return isGuaranteedLiteral(node.left);
      }
      if (t.isExpression(node.right)) {
        return isGuaranteedLiteral(node.right);
      }
      return false;
    case 'LogicalExpression':
      return isGuaranteedLiteral(node.left) || isGuaranteedLiteral(node.right);
    default:
      return false;
  }
}

export function isStatic(
  node: t.Expression
    | t.SpreadElement
    | t.AssignmentPattern
    | t.ArrayPattern
    | t.ObjectPattern
    | t.RestElement,
): boolean {
  // The following types are singular nested expressions
  switch (node.type) {
    case 'ParenthesizedExpression':
    case 'TypeCastExpression':
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
    case 'TSNonNullExpression':
    case 'TSTypeAssertion':
    case 'TSInstantiationExpression':
      return isStatic(node.expression);
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
    case 'NullLiteral':
    case 'BigIntLiteral':
    case 'RegExpLiteral':
    case 'Identifier':
    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
    case 'JSXElement':
    case 'JSXFragment':
      return true;
    case 'TemplateLiteral':
      for (let i = 0, len = node.expressions.length; i < len; i++) {
        const expr = node.expressions[i];
        if (t.isExpression(expr) && !isStatic(expr)) {
          return false;
        }
      }
      return true;
    case 'UnaryExpression':
    case 'UpdateExpression':
    case 'SpreadElement':
      return isStatic(node.argument);
    case 'RestElement':
      if (t.isTSParameterProperty(node.argument)) {
        return false;
      }
      return isStatic(node.argument);
    case 'ArrayExpression':
    case 'TupleExpression':
      for (let i = 0, len = node.elements.length; i < len; i++) {
        const expr = node.elements[i];
        if (expr && !isStatic(expr)) {
          return false;
        }
      }
      return true;
    case 'ArrayPattern':
      for (let i = 0, len = node.elements.length; i < len; i++) {
        const expr = node.elements[i];
        if (t.isTSParameterProperty(expr)) {
          return false;
        }
        if (expr && !isStatic(expr)) {
          return false;
        }
      }
      return true;
    case 'ObjectExpression':
    case 'RecordExpression':
      for (let i = 0, len = node.properties.length; i < len; i++) {
        const prop = node.properties[i];
        if (t.isObjectProperty(prop)) {
          const result = (() => {
            if (t.isExpression(prop.value) && isStatic(prop.value)) {
              return true;
            }
            if (prop.computed && t.isExpression(prop.key) && isStatic(prop.key)) {
              return true;
            }
            return false;
          })();
          if (!result) {
            return false;
          }
        }
        if (t.isSpreadElement(prop) && !isStatic(prop)) {
          return false;
        }
      }
      return true;
    case 'ObjectPattern':
      for (let i = 0, len = node.properties.length; i < len; i++) {
        const prop = node.properties[i];
        if (t.isObjectProperty(prop)) {
          const result = (() => {
            if (!t.isTSTypeParameter(prop.value) && isStatic(prop.value)) {
              return true;
            }
            if (prop.computed && t.isExpression(prop.key) && isStatic(prop.key)) {
              return true;
            }
            return false;
          })();
          if (!result) {
            return false;
          }
        }
        if (t.isSpreadElement(prop) && !isStatic(prop)) {
          return false;
        }
      }
      return true;
    case 'AssignmentExpression':
    case 'AssignmentPattern':
      if (isStatic(node.right)) {
        return true;
      }
      if (!t.isTSParameterProperty(node.left)) {
        return false;
      }
      return isStatic(node);
    case 'SequenceExpression':
      for (let i = 0, len = node.expressions.length; i < len; i++) {
        if (!isStatic(node.expressions[i])) {
          return false;
        }
      }
      return true;
    case 'ConditionalExpression':
      return isStatic(node.test)
        || isStatic(node.consequent)
        || isStatic(node.alternate);
    case 'BinaryExpression':
      if (t.isExpression(node.left)) {
        return isStatic(node.left);
      }
      if (t.isExpression(node.right)) {
        return isStatic(node.right);
      }
      return false;
    case 'LogicalExpression':
      return isStatic(node.left) || isStatic(node.right);
    default:
      return false;
  }
}

export function isAwaited(node: t.Expression | t.SpreadElement): boolean {
  switch (node.type) {
    case 'AwaitExpression':
      return true;
    case 'ParenthesizedExpression':
    case 'TypeCastExpression':
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
    case 'TSNonNullExpression':
    case 'TSTypeAssertion':
    case 'TSInstantiationExpression':
      return isAwaited(node.expression);
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
    case 'NullLiteral':
    case 'BigIntLiteral':
    case 'RegExpLiteral':
    case 'Identifier':
    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
    case 'JSXElement':
    case 'JSXFragment':
    case 'ClassExpression':
    case 'YieldExpression':
    case 'MetaProperty':
    case 'Super':
    case 'ThisExpression':
    case 'Import':
    case 'DoExpression':
      return false;
    case 'TemplateLiteral':
      for (let i = 0, len = node.expressions.length; i < len; i++) {
        const expr = node.expressions[i];
        if (t.isExpression(expr) && isAwaited(expr)) {
          return true;
        }
      }
      return false;
    case 'TaggedTemplateExpression':
      return isAwaited(node.tag) || isAwaited(node.quasi);
    case 'UnaryExpression':
    case 'UpdateExpression':
    case 'SpreadElement':
      return isAwaited(node.argument);
    case 'ArrayExpression':
    case 'TupleExpression':
      for (let i = 0, len = node.elements.length; i < len; i++) {
        const expr = node.elements[i];
        if (expr && isAwaited(expr)) {
          return true;
        }
      }
      return false;
    case 'AssignmentExpression':
      if (isAwaited(node.right)) {
        return true;
      }
      if (t.isExpression(node.left)) {
        return isAwaited(node.left);
      }
      return false;
    case 'BinaryExpression':
      if (t.isExpression(node.left) && isAwaited(node.left)) {
        return true;
      }
      return isAwaited(node.right);
    case 'CallExpression':
    case 'OptionalCallExpression':
    case 'NewExpression':
      if (t.isExpression(node.callee) && isAwaited(node.callee)) {
        return true;
      }
      for (let i = 0, len = node.arguments.length; i < len; i++) {
        const arg = node.arguments[i];
        if ((t.isSpreadElement(arg) || t.isExpression(arg)) && isAwaited(arg)) {
          return true;
        }
      }
      return false;
    case 'ConditionalExpression':
      return isAwaited(node.test)
        || isAwaited(node.consequent)
        || isAwaited(node.alternate);
    case 'LogicalExpression':
      return isAwaited(node.left) || isAwaited(node.right);
    case 'MemberExpression':
    case 'OptionalMemberExpression':
      return isAwaited(node.object)
        || (node.computed && t.isExpression(node.property) && isAwaited(node.property));
    case 'SequenceExpression':
      for (let i = 0, len = node.expressions.length; i < len; i++) {
        if (isAwaited(node.expressions[i])) {
          return true;
        }
      }
      return false;
    case 'ObjectExpression':
    case 'RecordExpression':
      for (let i = 0, len = node.properties.length; i < len; i++) {
        const prop = node.properties[i];
        const result = (() => {
          if (t.isObjectProperty(prop)) {
            if (t.isExpression(prop.value) && isAwaited(prop.value)) {
              return true;
            }
            if (prop.computed && t.isExpression(prop.key) && isAwaited(prop.key)) {
              return true;
            }
            return false;
          }
          if (t.isSpreadElement(prop)) {
            return isAwaited(prop);
          }
          return false;
        })();
        if (result) {
          return true;
        }
      }
      return false;
    case 'BindExpression':
      return isAwaited(node.object) || isAwaited(node.callee);
    default:
      return false;
  }
}
