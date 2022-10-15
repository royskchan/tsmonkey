import * as ast from "../ast/ast";
import * as lexer from "../lexer/lexer";
import * as token from "../token/token";

// precedence;
enum Precedence {
  LOWEST,
  EQUALS, // ==
  LESSGREATER, // > or <
  SUM, // +
  PRODUCT, // *
  PREFIX, // -X or !X
  CALL, // myFunction(X)
  INDEX,
}

let precedences: { [key: string]: number } = {};
precedences[token.EQ] = Precedence.EQUALS;
precedences[token.NOT_EQ] = Precedence.EQUALS;
precedences[token.LT] = Precedence.LESSGREATER;
precedences[token.GT] = Precedence.LESSGREATER;
precedences[token.PLUS] = Precedence.SUM;
precedences[token.MINUS] = Precedence.SUM;
precedences[token.SLASH] = Precedence.PRODUCT;
precedences[token.ASTERISK] = Precedence.PRODUCT;
precedences[token.LPAREN] = Precedence.CALL;
precedences[token.LBRACKET] = Precedence.INDEX;

type Nullable<T> = T | null;
type prefixParseFn = () => Nullable<ast.Expression>;
type infixParseFn = (left: ast.Expression) => Nullable<ast.Expression>;

export class Parser {
  protected curToken: token.Token;
  protected peekToken: token.Token;
  protected _errors: string[] = [];

  protected prefixParseFns: { [key: string]: prefixParseFn } = {};
  protected infixParseFns: { [key: string]: infixParseFn } = {};

  constructor(protected l: lexer.Lexer) {
    this.nextToken();
    this.nextToken();

    this.registerPrefix(token.IDENT, this.parseIdentifier.bind(this));
    this.registerPrefix(token.INT, this.parseIntegerLiteral.bind(this));
    this.registerPrefix(token.TRUE, this.parseBoolean.bind(this));
    this.registerPrefix(token.FALSE, this.parseBoolean.bind(this));
    this.registerPrefix(token.BANG, this.parsePrefixExpression.bind(this));
    this.registerPrefix(token.MINUS, this.parsePrefixExpression.bind(this));
    this.registerPrefix(token.LPAREN, this.parseGroupedExpression.bind(this));
    this.registerPrefix(token.IF, this.parseIfExpression.bind(this));
    this.registerPrefix(token.FUNCTION, this.parseFunctionLiteral.bind(this));
    this.registerPrefix(token.STRING, this.parseStringLiteral.bind(this));
    this.registerPrefix(token.LBRACKET, this.parseArrayLiteral.bind(this));
    this.registerPrefix(token.LBRACE, this.parseHashLiteral.bind(this));

    this.registerInfix(token.PLUS, this.parseInfixExpression.bind(this));
    this.registerInfix(token.MINUS, this.parseInfixExpression.bind(this));
    this.registerInfix(token.SLASH, this.parseInfixExpression.bind(this));
    this.registerInfix(token.ASTERISK, this.parseInfixExpression.bind(this));
    this.registerInfix(token.EQ, this.parseInfixExpression.bind(this));
    this.registerInfix(token.NOT_EQ, this.parseInfixExpression.bind(this));
    this.registerInfix(token.LT, this.parseInfixExpression.bind(this));
    this.registerInfix(token.GT, this.parseInfixExpression.bind(this));
    this.registerInfix(token.LPAREN, this.parseCallExpression.bind(this));
    this.registerInfix(token.LBRACKET, this.parseIndexExpression.bind(this));
  }

  // parser: Program
  parseProgram(): ast.Program {
    let program = new ast.Program();
    program.statements = [];

    while (this.curToken.type !== token.EOF) {
      let stmt = this.parseStatement();
      if (stmt) {
        program.statements.push(stmt);
      }
      this.nextToken();
    }
    return program;
  }

  errors(): string[] {
    return this._errors;
  }

  // parse: Statement
  protected parseStatement(): ast.Statement | null {
    switch (this.curToken.type) {
      case token.LET:
        return this.paserLetStatement();
      case token.RETURN:
        return this.paserReturnStatement();
      default:
        return this.parseExpressionStatement();
    }
  }

  // parse: LetStatement
  protected paserLetStatement(): ast.LetStatement | null {
    let stmt = new ast.LetStatement(this.curToken);
    if (!this.expectPeek(token.IDENT)) {
      return null;
    }

    stmt.name = new ast.Identifier(this.curToken, this.curToken.literal);

    if (!this.expectPeek(token.ASSIGN)) {
      return null;
    }

    this.nextToken();

    stmt.value = this.parseExpression(Precedence.LOWEST)!;

    if (this.peekTokenIs(token.SEMICOLON)) {
      this.nextToken();
    }

    return stmt;
  }

  // parse: ReturnStatement
  protected paserReturnStatement(): ast.ReturnStatement | null {
    let stmt = new ast.ReturnStatement(this.curToken);
    this.nextToken();

    stmt.returnValue = this.parseExpression(Precedence.LOWEST)!;

    while (!this.curTokenIs(token.SEMICOLON)) {
      this.nextToken();
    }

    return stmt;
  }

  // parse: ExpressionStatement
  protected parseExpressionStatement(): ast.ExpressionStatement | null {
    let stmt = new ast.ExpressionStatement(this.curToken);
    stmt.expression = this.parseExpression(Precedence.LOWEST) || stmt.expression;

    if (this.peekTokenIs(token.SEMICOLON)) {
      this.nextToken();
    }

    return stmt;
  }

  // parse: Expression
  protected parseExpression(precedence: number): Nullable<ast.Expression> {
    let prefix = this.prefixParseFns[this.curToken.type];
    if (!prefix) {
      this.noPrefixParseFnError(this.curToken.type);
      return null;
    }
    let leftExp = prefix()!;

    while (!this.peekTokenIs(token.SEMICOLON) && precedence < this.peekPrecedence()) {
      let infix = this.infixParseFns[this.peekToken.type];
      if (!infix) {
        return leftExp;
      }
      this.nextToken();
      leftExp = infix(leftExp)!;
    }
    return leftExp;
  }

  // parse: Identifier
  protected parseIdentifier(): Nullable<ast.Expression> {
    return new ast.Identifier(this.curToken, this.curToken.literal);
  }

  // parse: IntegerLiteral
  protected parseIntegerLiteral(): Nullable<ast.Expression> {
    let lit = new ast.IntegerLiteral(this.curToken);
    let val = parseInt(this.curToken.literal);
    if (val === undefined) {
      let msg = `could not parse ${this.curToken.literal} as integer`;
      this.peekError(msg);
      return null;
    }
    lit.value = val;
    return lit;
  }

  // parse: PrefixExpression
  protected parsePrefixExpression(): Nullable<ast.Expression> {
    let expression = new ast.PrefixExpression(this.curToken, this.curToken.literal);

    this.nextToken();
    expression.right = this.parseExpression(Precedence.PREFIX) || expression.right;
    return expression;
  }

  // parse: InfixExpression
  protected parseInfixExpression(left: ast.Expression): Nullable<ast.Expression> {
    let expression = new ast.InfixExpression(this.curToken, left, this.curToken.literal);

    let precedence = this.curPrecedence();
    this.nextToken();
    expression.right = this.parseExpression(precedence) || expression.right;
    return expression;
  }

  // parse: Boolean
  protected parseBoolean(): Nullable<ast.Expression> {
    return new ast.Boolean(this.curToken, this.curTokenIs(token.TRUE));
  }

  // parse: Expression (Grouped)
  protected parseGroupedExpression(): Nullable<ast.Expression> {
    this.nextToken();
    let exp = this.parseExpression(Precedence.LOWEST);
    if (!this.expectPeek(token.RPAREN)) {
      return null;
    }
    return exp;
  }

  // parse: IfExpression
  protected parseIfExpression(): ast.Expression | null {
    let expression = new ast.IfExpression(this.curToken);

    if (!this.expectPeek(token.LPAREN)) {
      return null;
    }

    this.nextToken();
    expression.condition = this.parseExpression(Precedence.LOWEST)!;

    if (!this.expectPeek(token.RPAREN)) {
      return null;
    }
    if (!this.expectPeek(token.LBRACE)) {
      return null;
    }
    expression.consequence = this.parseBlockStatement();

    if (this.peekTokenIs(token.ELSE)) {
      this.nextToken();
      if (!this.expectPeek(token.LBRACE)) {
        return null;
      }
      expression.alternative = this.parseBlockStatement();
    }
    return expression;
  }

  // parse: BlockStatement
  protected parseBlockStatement(): ast.BlockStatement {
    let block = new ast.BlockStatement(this.curToken);
    block.statements = [];

    this.nextToken();

    while (!this.curTokenIs(token.RBRACE)) {
      let stmt = this.parseStatement();
      if (stmt) {
        block.statements.push(stmt);
      }
      this.nextToken();
    }

    return block;
  }

  // parse: FunctionLiteral
  protected parseFunctionLiteral(): ast.Expression | null {
    let lit = new ast.FunctionLiteral(this.curToken);

    if (!this.expectPeek(token.LPAREN)) {
      return null;
    }

    lit.parameters = this.parseFunctionParameters()!;

    if (!this.expectPeek(token.LBRACE)) {
      return null;
    }

    lit.body = this.parseBlockStatement();
    return lit;
  }

  // parse: FunctionLiteral (parameters)
  protected parseFunctionParameters(): ast.Identifier[] | null {
    let identifiers: ast.Identifier[] = [];

    if (this.peekTokenIs(token.RPAREN)) {
      this.nextToken();
      return identifiers;
    }

    this.nextToken();
    let ident = new ast.Identifier(this.curToken, this.curToken.literal);
    identifiers.push(ident);

    while (this.peekTokenIs(token.COMMA)) {
      this.nextToken();
      this.nextToken();
      ident = new ast.Identifier(this.curToken, this.curToken.literal);
      identifiers.push(ident);
    }

    if (!this.expectPeek(token.RPAREN)) {
      return null;
    }

    return identifiers;
  }

  // parse: CallExpression
  protected parseCallExpression(func: ast.Expression): ast.Expression | null {
    let exp = new ast.CallExpression(this.curToken, func);
    exp.arguments = this.parseExpressionList(token.RPAREN)!;
    return exp;
  }

  // parse: Expressions[]
  protected parseExpressionList(end: token.TokenType): ast.Expression[] | null {
    let args: ast.Expression[] = [];

    if (this.peekTokenIs(end)) {
      this.nextToken();
      return args;
    }

    this.nextToken();
    args.push(this.parseExpression(Precedence.LOWEST)!);

    while (this.peekTokenIs(token.COMMA)) {
      this.nextToken();
      this.nextToken();
      args.push(this.parseExpression(Precedence.LOWEST)!);
    }

    if (!this.expectPeek(end)) {
      return null;
    }

    return args;
  }

  // parse: StringLiteral
  protected parseStringLiteral(): ast.Expression | null {
    return new ast.StringLiteral(this.curToken, this.curToken.literal);
  }

  // parse: ArrayLiteral
  protected parseArrayLiteral(): ast.Expression | null {
    let array = new ast.ArrayLiteral(this.curToken);
    array.elements = this.parseExpressionList(token.RBRACKET)!;
    return array;
  }

  // parse: IndexExpression
  protected parseIndexExpression(left: ast.Expression): ast.Expression | null {
    let exp = new ast.IndexExpression(this.curToken);
    exp.left = left;
    this.nextToken();
    exp.index = this.parseExpression(Precedence.LOWEST)!;

    if (!this.expectPeek(token.RBRACKET)) {
      return null;
    }

    return exp;
  }

  // parse: HashLiteral
  protected parseHashLiteral(): ast.Expression | null {
    let hash = new ast.HashLiteral(this.curToken);
    hash.pairs = [];
    while (!this.peekTokenIs(token.RBRACE)) {
      this.nextToken();
      let key = this.parseExpression(Precedence.LOWEST)!;
      if (!this.expectPeek(token.COLON)) {
        return null;
      }
      this.nextToken();
      let val = this.parseExpression(Precedence.LOWEST)!;

      hash.pairs.push({ keyNode: key, valueNode: val });
      if (!this.peekTokenIs(token.RBRACE) && !this.expectPeek(token.COMMA)) {
        return null;
      }
    }
    if (!this.expectPeek(token.RBRACE)) {
      return null;
    }
    return hash;
  }

  // -- helper --
  // helper: nextToken
  protected nextToken(): void {
    this.curToken = this.peekToken;
    this.peekToken = this.l.nextToken();
  }

  // helper: registerPrefix
  protected registerPrefix(tokenType: token.TokenType, fn: prefixParseFn) {
    this.prefixParseFns[tokenType] = fn;
  }

  // helper: registerInfix
  protected registerInfix(tokenType: token.TokenType, fn: infixParseFn) {
    this.infixParseFns[tokenType] = fn;
  }

  // helper: peekError
  protected peekError(t: token.TokenType) {
    let msg = `expected next token to be ${t}, got ${this.peekToken.type} instead`;
    this._errors.push(msg);
  }

  // helper: curTokenIs
  protected curTokenIs(t: token.TokenType): boolean {
    return this.curToken.type === t;
  }

  // helper: peekTokenIs
  protected peekTokenIs(t: token.TokenType): boolean {
    return this.peekToken.type === t;
  }

  // helper: expectPeek
  protected expectPeek(t: token.TokenType): boolean {
    if (this.peekTokenIs(t)) {
      this.nextToken();
      return true;
    } else {
      this.peekError(t);
      return false;
    }
  }

  // helper: peekPrecedence
  protected peekPrecedence(): number {
    let p = precedences[this.peekToken.type];
    return p || Precedence.LOWEST;
  }

  // helper: curPrecedence
  protected curPrecedence(): number {
    let p = precedences[this.curToken.type];
    return p || Precedence.LOWEST;
  }

  // helper: noPrefixParseFnError
  protected noPrefixParseFnError(t: token.TokenType) {
    let msg = `no prefix parse function for ${t} found`;
    this._errors.push(msg);
  }
}
