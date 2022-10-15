import * as token from "../token/token";

export interface Node {
  tokenLiteral(): string;
  string(): string;
}

export interface Statement extends Node {
  statementNode(): void;
}

export interface Expression extends Node {
  expressionNode(): void;
}

export class Program implements Node {
  statements: Statement[] = [];

  constructor() {}

  tokenLiteral(): string {
    if (this.statements?.length > 0) {
      return this.statements[0].tokenLiteral();
    } else {
      return "";
    }
  }

  string(): string {
    let out = "";
    for (let s of this.statements) {
      out = out + s.string();
    }
    return out;
  }
}

export class LetStatement implements Statement {
  name: Identifier;
  value: Expression;

  constructor(public token: token.Token, name?: Identifier, value?: Expression) {
    this.name = name || this.name;
    this.value = value || this.value;
  }

  statementNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }

  string(): string {
    let out = "";
    out = out + this.tokenLiteral() + " ";
    out = out + this.name.string();
    out = out + " = ";
    if (this.value) {
      out = out + this.value.string();
    }
    out = out + ";";
    return out;
  }
}

export class Identifier implements Expression {
  constructor(public token: token.Token, public value: string) {}

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }

  string(): string {
    return this.value;
  }
}

export class ReturnStatement implements Statement {
  returnValue: Expression;

  constructor(public token: token.Token) {}

  statementNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }

  string(): string {
    let out = this.tokenLiteral() + " ";
    if (this.returnValue) {
      out = out + this.returnValue.string();
    }
    out = out + ";";
    return out;
  }
}

export class ExpressionStatement implements Statement {
  expression: Expression;

  constructor(public token: token.Token) {}

  statementNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }

  string(): string {
    if (this.expression) {
      return this.expression.string();
    }
    return "";
  }
}

export class IntegerLiteral implements Expression {
  value: number;
  constructor(public token: token.Token) {}

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }

  string(): string {
    return this.token.literal;
  }
}

export class PrefixExpression implements Expression {
  operator: string;
  right: Expression;

  constructor(public token: token.Token, operator?: string, right?: Expression) {
    this.operator = operator || this.operator;
    this.right = right || this.right;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }

  string(): string {
    let out = "(";
    out = out + this.operator;
    out = out + this.right.string();
    out = out + ")";
    return out;
  }
}

export class InfixExpression implements Expression {
  left: Expression;
  operator: string;
  right: Expression;

  constructor(public token: token.Token, left?: Expression, operator?: string, right?: Expression) {
    this.left = left || this.left;
    this.operator = operator || this.operator;
    this.right = right || this.right;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }

  string(): string {
    let out = "(";
    out = out + this.left.string();
    out = out + " " + this.operator + " ";
    out = out + this.right.string();
    out = out + ")";
    return out;
  }
}

export class Boolean implements Expression {
  constructor(public token: token.Token, public value: boolean) {}

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }

  string(): string {
    return this.token.literal;
  }
}

export class IfExpression implements Expression {
  condition: Expression;
  consequence: BlockStatement;
  alternative?: BlockStatement;

  constructor(
    public token: token.Token,
    condition?: Expression,
    consequence?: BlockStatement,
    alternative?: BlockStatement
  ) {
    this.condition = condition || this.condition;
    this.consequence = consequence || this.consequence;
    this.alternative = alternative;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }

  string(): string {
    let out = "if ";
    out = out + this.condition.string();
    out = out + " ";
    out = out + this.consequence.string();
    if (this.alternative) {
      out = out + " else ";
      out = out + this.alternative.string();
    }
    return out;
  }
}

export class BlockStatement implements Expression {
  statements: Statement[] = [];
  constructor(public token: token.Token) {}

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }

  string(): string {
    let out = "";
    for (let s of this.statements) {
      out = out + s.string();
    }
    return out;
  }
}

export class FunctionLiteral implements Expression {
  parameters: Identifier[] = [];
  body: BlockStatement;
  constructor(public token: token.Token) {}

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }

  string(): string {
    let params: string[] = [];

    for (let p of this.parameters) {
      params.push(p.string());
    }

    let out = this.tokenLiteral();
    out = out + "(";
    out = out + params.join(", ");
    out = out + ")";
    out = out + this.body.string();
    return out;
  }
}

export class CallExpression implements Expression {
  function: Expression;
  arguments: Expression[] = [];
  constructor(public token: token.Token, func?: Expression) {
    this.function = func || this.function;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }

  string(): string {
    let args: string[] = [];

    for (let a of this.arguments) {
      args.push(a.string());
    }

    let out = this.function.string();
    out = out + "(";
    out = out + args.join(", ");
    out = out + ")";
    return out;
  }
}

export class StringLiteral implements Expression {
  constructor(public token: token.Token, public value: string) {}

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }

  string(): string {
    return this.token.literal;
  }
}

export class ArrayLiteral implements Expression {
  elements: Expression[] = [];
  constructor(public token: token.Token) {}

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }

  string(): string {
    let elements: string[] = [];

    for (let e of this.elements) {
      elements.push(e.string());
    }

    let out = "[";
    out = out + elements.join(", ");
    out = out + "]";
    return out;
  }
}

export class IndexExpression implements Expression {
  left: Expression;
  index: Expression;
  constructor(public token: token.Token) {}

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }

  string(): string {
    let out = "(";
    out = out + this.left.string();
    out = out + "[";
    out = out + this.index.string();
    out = out + "])";
    return out;
  }
}

export type ExpressionPair = { keyNode: Expression; valueNode: Expression };

export class HashLiteral implements Expression {
  pairs: ExpressionPair[] = [];
  constructor(public token: token.Token) {}

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }

  string(): string {
    let pairs: string[] = [];

    for (let pair of this.pairs) {
      pairs.push(pair.keyNode.string() + ": " + pair.valueNode.string());
    }

    let out = "{";
    out = out + pairs.join(", ");
    out = out + "}";
    return out;
  }
}
