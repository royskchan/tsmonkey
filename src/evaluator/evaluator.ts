import { setPrint } from "readline-sync";
import * as ast from "../ast/ast";
import * as object from "../object/object";

export const NULL = new object.Null();
export const TRUE = new object.Boolean(true);
export const FALSE = new object.Boolean(false);

// helper: newError
function newError(msg: string): object.Error {
  return new object.Error(msg);
}

function builtin_len(...args: object.Object[]): object.Object {
  if (args.length !== 1) {
    return newError(`wrong number of arguments. got=${args.length}, want=1`);
  }
  let arg = args[0];
  if (arg instanceof object.String) {
    return new object.Integer(arg.value.length);
  } else if (arg instanceof object.Array) {
    return new object.Integer(arg.elements.length);
  } else {
    return newError("argument to `len` not supported, got " + arg.type());
  }
}

function builtin_first(...args: object.Object[]): object.Object {
  if (args.length !== 1) {
    return newError(`wrong number of arguments. got=${args.length}, want=1`);
  }
  let arr = args[0];
  if (arr instanceof object.Array) {
    if (arr.elements.length > 0) {
      return arr.elements[0];
    } else {
      return NULL;
    }
  } else {
    return newError("argument to `first` must be ARRAY, got " + args[0].type());
  }
}

function builtin_last(...args: object.Object[]): object.Object {
  if (args.length !== 1) {
    return newError(`wrong number of arguments. got=${args.length}, want=1`);
  }
  let arr = args[0];
  if (arr instanceof object.Array) {
    if (arr.elements.length > 0) {
      return arr.elements[arr.elements.length - 1];
    } else {
      return NULL;
    }
  } else {
    return newError("argument to `last` must be ARRAY, got " + args[0].type());
  }
}

function builtin_rest(...args: object.Object[]): object.Object {
  if (args.length !== 1) {
    return newError(`wrong number of arguments. got=${args.length}, want=1`);
  }
  let arr = args[0];
  if (arr instanceof object.Array) {
    if (arr.elements.length > 0) {
      let elements = arr.elements.slice(1, arr.elements.length);
      return new object.Array(elements);
    } else {
      return NULL;
    }
  } else {
    return newError("argument to `rest` must be ARRAY, got " + args[0].type());
  }
}

function builtin_push(...args: object.Object[]): object.Object {
  if (args.length !== 2) {
    return newError(`wrong number of arguments. got=${args.length}, want=2`);
  }
  let arr = args[0];
  if (arr instanceof object.Array) {
    if (arr.elements.length > 0) {
      let elements = [...arr.elements];
      elements.push(args[1]);
      return new object.Array(elements);
    } else {
      return NULL;
    }
  } else {
    return newError("argument to `rest` must be ARRAY, got " + args[0].type());
  }
}

function builtin_puts(...args: object.Object[]): object.Object {
  for (let arg of args) {
    console.log(arg.inspect());
  }
  return NULL;
}

const builtins: { [key: string]: object.Builtin } = {};
builtins["len"] = new object.Builtin(builtin_len);
builtins["first"] = new object.Builtin(builtin_first);
builtins["last"] = new object.Builtin(builtin_last);
builtins["rest"] = new object.Builtin(builtin_rest);
builtins["push"] = new object.Builtin(builtin_push);
builtins["puts"] = new object.Builtin(builtin_puts);

export class Evaluator {
  constructor() {}

  // helper: nativeBoolToBooleanObject
  protected nativeBoolToBooleanObject(input: boolean): object.Boolean {
    if (input) {
      return TRUE;
    }
    return FALSE;
  }

  // helper: isTruthy
  protected isTruthy(obj: object.Object | null): boolean {
    switch (obj) {
      case NULL:
        return false;
      case TRUE:
        return true;
      case FALSE:
        return false;
      default:
        return true;
    }
  }

  // helper: newError
  protected newError(msg: string): object.Error {
    return new object.Error(msg);
  }

  // helper: isError
  protected isError(obj: object.Object | null): boolean {
    if (obj) {
      return obj.type() === object.ERROR_OBJ;
    }
    return false;
  }

  // eval: Node
  eval(node: ast.Node, env: object.Environment): object.Object | null {
    if (node instanceof ast.Program) {
      return this.evalProgram(node.statements, env);
    } else if (node instanceof ast.ExpressionStatement) {
      return this.eval(node.expression, env);
    } else if (node instanceof ast.PrefixExpression) {
      let right = this.eval(node.right, env);
      if (this.isError(right)) {
        return right;
      }
      return this.evalPrefixExpression(node.operator, right!);
    } else if (node instanceof ast.InfixExpression) {
      let left = this.eval(node.left, env);
      if (this.isError(left)) {
        return left;
      }
      let right = this.eval(node.right, env);
      if (this.isError(right)) {
        return right;
      }
      return this.evalInfixExpression(node.operator, left!, right!);
    } else if (node instanceof ast.BlockStatement) {
      return this.evalBlockStatement(node, env);
    } else if (node instanceof ast.IfExpression) {
      return this.evalIfExpression(node, env);
    } else if (node instanceof ast.ReturnStatement) {
      let val = this.eval(node.returnValue, env);
      if (this.isError(val)) {
        return val;
      }
      return new object.ReturnValue(val!);
    } else if (node instanceof ast.LetStatement) {
      let val = this.eval(node.value, env);
      if (this.isError(val)) {
        return val;
      }
      env.set(node.name.value, val!);
    } else if (node instanceof ast.Identifier) {
      return this.evalIdentifier(node, env);
    } else if (node instanceof ast.FunctionLiteral) {
      let fnObj = new object.Function();
      fnObj.parameters = node.parameters;
      fnObj.body = node.body;
      fnObj.env = env;
      return fnObj;
    } else if (node instanceof ast.CallExpression) {
      let func = this.eval(node.function, env);
      if (this.isError(func)) {
        return func;
      }
      let args = this.evalExpressions(node.arguments, env);
      if (args.length === 1 && this.isError(args[0])) {
        return args[0];
      }
      return this.applyFunction(func, args);
    } else if (node instanceof ast.ArrayLiteral) {
      let elements = this.evalExpressions(node.elements, env);
      if (elements.length === 1 && this.isError(elements[0])) {
        return elements[0];
      }
      return new object.Array(elements);
    } else if (node instanceof ast.IndexExpression) {
      let left = this.eval(node.left, env);
      if (this.isError(left)) {
        return left;
      }
      let index = this.eval(node.index, env);
      if (this.isError(index)) {
        return index;
      }
      return this.evalIndexExpression(left!, index!);
    } else if (node instanceof ast.HashLiteral) {
      return this.evalHashLiteral(node, env);
    } else if (node instanceof ast.StringLiteral) {
      return new object.String(node.value);
    } else if (node instanceof ast.IntegerLiteral) {
      return new object.Integer(node.value);
    } else if (node instanceof ast.Boolean) {
      return this.nativeBoolToBooleanObject(node.value);
    }
    return null;
  }

  // eval: Program
  protected evalProgram(stmts: ast.Statement[], env: object.Environment): object.Object | null {
    let result: object.Object | null = null;

    for (let statement of stmts) {
      result = this.eval(statement, env);
      if (result instanceof object.ReturnValue) {
        return result.value;
      } else if (result instanceof object.Error) {
        return result;
      }
    }
    return result;
  }

  // eval: Program
  protected evalBlockStatement(
    block: ast.BlockStatement,
    env: object.Environment
  ): object.Object | null {
    let result: object.Object | null = null;

    for (let statement of block.statements) {
      result = this.eval(statement, env);
      if (result?.type() === object.RETURN_VALUE_OBJ || result?.type() === object.ERROR_OBJ) {
        return result;
      }
    }
    return result;
  }

  // eval: Expression
  protected evalExpressions(exps: ast.Expression[], env: object.Environment): object.Object[] {
    let result: object.Object[] = [];

    for (let e of exps) {
      let evaluated = this.eval(e, env)!;
      if (this.isError(evaluated)) {
        result = [];
        result.push(evaluated);
        return result;
      }
      result.push(evaluated);
    }
    return result;
  }

  // eval: PrefixExpression
  protected evalPrefixExpression(operator: string, right: object.Object): object.Object | null {
    switch (operator) {
      case "!":
        return this.evalBangOperatorExpression(right);
      case "-":
        return this.evalMinusOperatorExpression(right);
      default:
        return this.newError(`unknown operator: ${operator}${right.type()}`);
    }
  }

  // eval: PrefixExpression (!)
  protected evalBangOperatorExpression(right: object.Object): object.Object {
    switch (right) {
      case TRUE:
        return FALSE;
      case FALSE:
        return TRUE;
      case NULL:
        return TRUE;
      default:
        return FALSE;
    }
  }

  // eval: PrefixExpression (-)
  protected evalMinusOperatorExpression(right: object.Object): object.Object {
    if (right.type() !== object.INTEGER_OBJ) {
      return this.newError(`unknown operator: -${right.type()}`);
    }
    if (right instanceof object.Integer) {
      let val = right.value;
      return new object.Integer(-val);
    }
    return NULL;
  }

  // eval: InfixExpression
  protected evalInfixExpression(
    operator: string,
    left: object.Object,
    right: object.Object
  ): object.Object | null {
    if (left.type() === object.INTEGER_OBJ && right.type() === object.INTEGER_OBJ) {
      return this.evalIntegerInfixExpression(operator, left, right);
    } else if (left.type() === object.STRING_OBJ && right.type() === object.STRING_OBJ) {
      return this.evalStringInfixExpression(operator, left, right);
    } else if (operator === "==") {
      return this.nativeBoolToBooleanObject(left === right);
    } else if (operator === "!=") {
      return this.nativeBoolToBooleanObject(left !== right);
    } else if (left.type() !== right.type()) {
      return this.newError(`type mismatch: ${left.type()} ${operator} ${right.type()}`);
    } else {
      return this.newError(`unknown operator: ${left.type()} ${operator} ${right.type()}`);
    }
  }

  // eval: InfixExpression (Integer)
  protected evalIntegerInfixExpression(
    operator: string,
    left: object.Object,
    right: object.Object
  ): object.Object | null {
    let leftInt = <object.Integer>left;
    let rightInt = <object.Integer>right;

    let leftVal = leftInt.value;
    let rightVal = rightInt.value;

    switch (operator) {
      case "+":
        return new object.Integer(leftVal + rightVal);
      case "-":
        return new object.Integer(leftVal - rightVal);
      case "*":
        return new object.Integer(leftVal * rightVal);
      case "/":
        return new object.Integer(leftVal / rightVal);
      case "<":
        return this.nativeBoolToBooleanObject(leftVal < rightVal);
      case ">":
        return this.nativeBoolToBooleanObject(leftVal > rightVal);
      case "==":
        return this.nativeBoolToBooleanObject(leftVal === rightVal);
      case "!=":
        return this.nativeBoolToBooleanObject(leftVal !== rightVal);
      default:
        return this.newError(`unknown operator: ${left.type()} ${operator} ${right.type()}`);
    }
  }

  // eval: InfixExpression (String)
  protected evalStringInfixExpression(
    operator: string,
    left: object.Object,
    right: object.Object
  ): object.Object | null {
    let leftStr = <object.String>left;
    let rightStr = <object.String>right;

    let leftVal = leftStr.value;
    let rightVal = rightStr.value;

    switch (operator) {
      case "+":
        return new object.String(leftVal + rightVal);
      default:
        return this.newError(`unknown operator: ${left.type()} ${operator} ${right.type()}`);
    }
  }

  // eval: IfEXpression
  protected evalIfExpression(ie: ast.IfExpression, env: object.Environment): object.Object | null {
    let condition = this.eval(ie.condition, env);
    if (this.isError(condition)) {
      return condition;
    }
    if (this.isTruthy(condition)) {
      return this.eval(ie.consequence, env);
    } else if (ie.alternative) {
      return this.eval(ie.alternative, env);
    } else {
      return NULL;
    }
  }

  // eval: Identifier
  protected evalIdentifier(node: ast.Identifier, env: object.Environment): object.Object | null {
    let val = env.get(node.value);
    if (val) {
      return val;
    }
    let builtin = builtins[node.value];
    if (builtin) {
      return builtin;
    }
    return this.newError(`identifier not found: ${node.value}`);
  }

  // eval: IndexExpression
  protected evalIndexExpression(left: object.Object, index: object.Object): object.Object | null {
    if (left.type() === object.ARRAY_OBJ && index.type() === object.INTEGER_OBJ) {
      return this.evalArrayIndexEXpression(left, index);
    } else if (left.type() === object.HASH_OBJ) {
      return this.evalHashIndexEXpression(left, index);
    } else {
      return this.newError(`index operator not supported: ${left.type()}`);
    }
  }

  // eval: IndexExpression (Array)
  protected evalArrayIndexEXpression(
    array: object.Object,
    index: object.Object
  ): object.Object | null {
    let arrayObj = <object.Array>array;
    let idxObj = <object.Integer>index;
    let idx = idxObj.value;
    let max = arrayObj.elements.length - 1;
    if (idx < 0 || idx > max) {
      return NULL;
    }
    return arrayObj.elements[idx];
  }

  // eval: IndexExpression (Hash)
  protected evalHashIndexEXpression(
    hash: object.Object,
    index: object.Object
  ): object.Object | null {
    let hashObj = <object.Hash>hash;
    let hashKey = <object.Hashable>(<any>index);
    if (!("hashKey" in hashKey)) {
      return this.newError(`unusable as hash key: ${index?.type()}`);
    }
    let pair = hashObj.pairs[hashKey.hashKey()];
    if (!pair) {
      return NULL;
    }
    return pair.value;
  }

  // eval: Hash
  protected evalHashLiteral(hash: ast.HashLiteral, env: object.Environment): object.Object | null {
    let pairs: object.HashPairMap = {};

    for (let p of hash.pairs) {
      let key = this.eval(p.keyNode, env)!;
      if (this.isError(key)) {
        return key;
      }

      let hashKey = <object.Hashable>(<any>key);
      if (!("hashKey" in hashKey)) {
        return this.newError(`unusable as hash key: ${key?.type()}`);
      }

      let value = this.eval(p.valueNode, env)!;
      if (this.isError(value)) {
        return value;
      }

      let hashed = hashKey.hashKey();
      pairs[hashed] = { key, value };
    }
    return new object.Hash(pairs);
  }

  protected applyFunction(fn: object.Object | null, args: object.Object[]): object.Object | null {
    if (fn instanceof object.Function) {
      let extendedEnv = this.extendFunctionEnv(fn, args);
      let evaluated = this.eval(fn.body, extendedEnv);
      return this.unwrapReturnValue(evaluated);
    } else if (fn instanceof object.Builtin) {
      return fn.fn(...args);
    }
    return this.newError(`not a function ${fn?.type()}`);
  }

  protected extendFunctionEnv(fn: object.Function, args: object.Object[]): object.Environment {
    let env = new object.Environment(fn.env);
    fn.parameters.forEach((p, i) => {
      env.set(p.value, args[i]);
    });
    return env;
  }

  protected unwrapReturnValue(obj: object.Object | null): object.Object | null {
    if (obj instanceof object.ReturnValue) {
      return obj.value;
    }
    return obj;
  }
}
