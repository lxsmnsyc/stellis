/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable eqeqeq */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-bitwise */
import * as t from '@babel/types';
import { every, forEach, some } from '../shared/arrays';
import assert from '../shared/assert';
import { Serializable } from '../shared/attr';

export function unwrapLiteral(node: t.Expression): Serializable {
  if (
    t.isParenthesizedExpression(node)
    || t.isTypeCastExpression(node)
    || t.isTSAsExpression(node)
    || t.isTSSatisfiesExpression(node)
    || t.isTSNonNullExpression(node)
    || t.isTSTypeAssertion(node)
    || t.isTSInstantiationExpression(node)
  ) {
    return unwrapLiteral(node.expression);
  }
  if (
    t.isStringLiteral(node)
    || t.isNumericLiteral(node)
    || t.isBooleanLiteral(node)
  ) {
    return node.value;
  }
  if (t.isNullLiteral(node)) {
    return null;
  }
  if (t.isBigIntLiteral(node)) {
    return BigInt(node.value);
  }
  if (t.isRegExpLiteral(node)) {
    return new RegExp(node.pattern, node.flags);
  }
  if (t.isDecimalLiteral(node)) {
    return node.value;
  }
  if (t.isTemplateLiteral(node)) {
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
  if (t.isUnaryExpression(node)) {
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
  if (t.isConditionalExpression(node)) {
    const test = unwrapLiteral(node.test);
    const consequent = unwrapLiteral(node.consequent);
    const alternate = unwrapLiteral(node.alternate);
    return test ? consequent : alternate;
  }
  if (t.isBinaryExpression(node)) {
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
  assert(t.isLogicalExpression(node), new Error('Attempted to unwrap a non-guaranteed literal'));
  const left = unwrapLiteral(node.left) as any;
  const right = unwrapLiteral(node.right) as any;
  switch (node.operator) {
    case '&&': return left && right;
    case '??': return left ?? right;
    case '||': return left || right;
    default: return undefined;
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
  if (t.isLiteral(node)) {
    // Check if it is template literal but with only static expressions
    if (t.isTemplateLiteral(node)) {
      return every(node.expressions, (expr) => {
        if (t.isExpression(expr)) {
          return isGuaranteedLiteral(expr);
        }
        return false;
      });
    }
    return true;
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
    return isGuaranteedLiteral(node.expression);
  }
  if (t.isUnaryExpression(node)) {
    if (node.operator === 'throw' || node.operator === 'delete') {
      return false;
    }
    return isGuaranteedLiteral(node.argument);
  }
  if (t.isConditionalExpression(node)) {
    return isGuaranteedLiteral(node.test)
      || isGuaranteedLiteral(node.consequent)
      || isGuaranteedLiteral(node.alternate);
  }
  if (t.isBinaryExpression(node)) {
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
  }
  if (t.isLogicalExpression(node)) {
    return isGuaranteedLiteral(node.left) || isGuaranteedLiteral(node.right);
  }
  return false;
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
  if (
    t.isParenthesizedExpression(node)
    || t.isTypeCastExpression(node)
    || t.isTSAsExpression(node)
    || t.isTSSatisfiesExpression(node)
    || t.isTSNonNullExpression(node)
    || t.isTSTypeAssertion(node)
    || t.isTSInstantiationExpression(node)
  ) {
    return isStatic(node.expression);
  }
  // Same as above
  if (
    t.isUnaryExpression(node)
    || t.isUpdateExpression(node)
    || t.isSpreadElement(node)
  ) {
    return isStatic(node.argument);
  }
  if (t.isRestElement(node)) {
    if (t.isTSParameterProperty(node.argument)) {
      return false;
    }
    return isStatic(node.argument);
  }
  if (t.isLiteral(node)) {
    if (t.isTemplateLiteral(node)) {
      return every(node.expressions, (expr) => {
        if (t.isExpression(expr)) {
          return isStatic(expr);
        }
        return false;
      });
    }
    return true;
  }
  // The following types are always static
  if (
    t.isIdentifier(node)
    || t.isArrowFunctionExpression(node)
    || t.isFunctionExpression(node)
    || t.isJSXElement(node)
    || t.isJSXFragment(node)
  ) {
    return true;
  }
  // Arrays and tuples might have static values
  if (
    t.isArrayExpression(node)
    || t.isTupleExpression(node)
  ) {
    return every(node.elements, (el) => {
      if (el) {
        return isStatic(el);
      }
      return true;
    });
  }
  if (t.isArrayPattern(node)) {
    return every(node.elements, (el) => {
      if (t.isTSParameterProperty(el)) {
        return false;
      }
      if (el) {
        return isStatic(el);
      }
      return true;
    });
  }
  if (t.isObjectExpression(node) || t.isRecordExpression(node)) {
    return every(node.properties, (prop) => {
      if (t.isObjectProperty(prop)) {
        if (t.isExpression(prop.value) && isStatic(prop.value)) {
          return true;
        }
        if (prop.computed && t.isExpression(prop.key) && isStatic(prop.key)) {
          return true;
        }
        return false;
      }
      if (t.isSpreadElement(prop)) {
        return isStatic(prop);
      }
      // Ignore
      return true;
    });
  }
  if (t.isObjectPattern(node)) {
    return every(node.properties, (prop) => {
      if (t.isObjectProperty(prop)) {
        if (!t.isTSTypeParameter(prop.value) && isStatic(prop.value)) {
          return true;
        }
        if (prop.computed && t.isExpression(prop.key) && isStatic(prop.key)) {
          return true;
        }
        return false;
      }
      if (t.isSpreadElement(prop)) {
        return isStatic(prop);
      }
      // Ignore
      return true;
    });
  }
  if (t.isAssignmentExpression(node) || t.isAssignmentPattern(node)) {
    if (isStatic(node.right)) {
      return true;
    }
    if (!t.isTSParameterProperty(node.left)) {
      return false;
    }
    return isStatic(node);
  }
  if (t.isSequenceExpression(node)) {
    return every(node.expressions, isStatic);
  }
  if (t.isConditionalExpression(node)) {
    return isStatic(node.test)
      || isStatic(node.consequent)
      || isStatic(node.alternate);
  }
  if (t.isBinaryExpression(node)) {
    if (t.isExpression(node.left)) {
      return isStatic(node.left);
    }
    if (t.isExpression(node.right)) {
      return isStatic(node.right);
    }
    return false;
  }
  if (t.isLogicalExpression(node)) {
    return isStatic(node.left) || isStatic(node.right);
  }
  return false;
}

export function isAwaited(node: t.Expression | t.SpreadElement): boolean {
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
        return false;
      }
      if (t.isSpreadElement(prop)) {
        return isAwaited(prop);
      }
      return false;
    });
  }
  if (t.isBindExpression(node)) {
    return isAwaited(node.object) || isAwaited(node.callee);
  }
  return false;
}
