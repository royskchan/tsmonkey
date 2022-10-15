import * as ast from "../ast/ast";

export type ObjectType = string;

export type BuildinFunction = (...args: Object[]) => Object;

export const INTEGER_OBJ = "INTEGER";
export const BOOLEAN_OBJ = "BOOLEAN";
export const NULL_OBJ = "NULL";
export const RETURN_VALUE_OBJ = "RETURN_VALUE";
export const ERROR_OBJ = "ERROR";
export const FUNCTION_OBJ = "FUNCTION";
export const STRING_OBJ = "STRING";
export const BUILTIN_OBJ = "BUILTIN";
export const ARRAY_OBJ = "ARRAY";
export const HASH_OBJ = "HASH";

export type HashKey = string;

function hash(obj: Object): HashKey {
  return `${obj.type()}@${obj.inspect()}`;
}

export interface Hashable {
  hashKey(): HashKey;
}

export interface Object {
  type(): ObjectType;
  inspect(): string;
}

export class Integer implements Object, Hashable {
  constructor(public value: number) {}

  type(): ObjectType {
    return INTEGER_OBJ;
  }

  inspect(): string {
    return this.value.toString();
  }

  hashKey(): HashKey {
    return hash(this);
  }
}

export class Boolean implements Object, Hashable {
  constructor(public value: boolean) {}

  type(): ObjectType {
    return BOOLEAN_OBJ;
  }

  inspect(): string {
    return this.value.toString();
  }

  hashKey(): HashKey {
    return hash(this);
  }
}

export class Null implements Object {
  constructor() {}

  type(): ObjectType {
    return NULL_OBJ;
  }
  inspect(): string {
    return "null";
  }
}

export class ReturnValue implements Object {
  constructor(public value: Object) {}

  type(): ObjectType {
    return RETURN_VALUE_OBJ;
  }
  inspect(): string {
    return this.value.inspect();
  }
}

export class Error implements Object {
  constructor(public message: string) {}

  type(): ObjectType {
    return ERROR_OBJ;
  }
  inspect(): string {
    return `ERROR: ${this.message}`;
  }
}

export class Function implements Object {
  parameters: ast.Identifier[] = [];
  body: ast.BlockStatement;
  env: Environment;

  constructor() {}

  type(): ObjectType {
    return FUNCTION_OBJ;
  }
  inspect(): string {
    let params: string[] = [];

    for (let p of this.parameters) {
      params.push(p.string());
    }

    let out = "fn";
    out = out + "(";
    out = out + params.join(", ");
    out = out + ") {\n";
    out = out + this.body.string();
    out = out + "\n}";
    return out;
  }
}

export class String implements Object, Hashable {
  constructor(public value: string) {}

  type(): ObjectType {
    return STRING_OBJ;
  }

  inspect(): string {
    return this.value;
  }

  hashKey(): HashKey {
    return hash(this);
  }
}

export class Builtin implements Object {
  constructor(public fn: BuildinFunction) {}

  type(): ObjectType {
    return BUILTIN_OBJ;
  }
  inspect(): string {
    return "builtin function";
  }
}

export class Array implements Object {
  elements: Object[] = [];
  constructor(elements?: Object[]) {
    this.elements = elements || this.elements;
  }

  type(): ObjectType {
    return ARRAY_OBJ;
  }
  inspect(): string {
    let elements: string[] = [];

    for (let e of this.elements) {
      elements.push(e.inspect());
    }

    let out = "[";
    out = out + elements.join(", ");
    out = out + "]";
    return out;
  }
}

export type HashPair = {
  key: Object;
  value: Object;
};

export type HashPairMap = { [key: string]: HashPair };

export class Hash implements Object {
  pairs: HashPairMap = {};
  constructor(pairs?: HashPairMap) {
    this.pairs = pairs || this.pairs;
  }

  type(): ObjectType {
    return HASH_OBJ;
  }
  inspect(): string {
    let pairs: string[] = [];

    for (let hashKey in this.pairs) {
      let p = this.pairs[hashKey];
      pairs.push(p.key.inspect() + ": " + p.value.inspect());
    }

    let out = "{";
    out = out + pairs.join(", ");
    out = out + "}";
    return out;
  }
}

export class Environment {
  store: { [key: string]: Object } = {};
  constructor(protected outer?: Environment) {}

  get(name: string): Object | undefined {
    let obj = this.store[name];
    if (!obj && this.outer) {
      return this.outer.get(name);
    }
    return obj;
  }

  set(name: string, val: Object): Object {
    this.store[name] = val;
    return val;
  }
}
