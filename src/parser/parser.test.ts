import { expect } from "chai";
import * as ast from "../ast/ast";
import * as lexer from "../lexer/lexer";
import * as parser from "./parser";

// helper: checkParserErrors
function checkParserErrors(p: parser.Parser) {
  let errors = p.errors();
  if (errors.length === 0) {
    return;
  }

  for (let msg of errors) {
    expect(false).equal(true, `parser error:${msg}`);
  }
}

// helper: testLetStatement
function testLetStatement(s: ast.Statement, name: string) {
  expect(s.tokenLiteral()).equal("let", `s.TokenLiteral not 'let'. got=${s.tokenLiteral()}`);
  let letStmt = <ast.LetStatement>s;
  expect(s).to.be.an.instanceof(ast.LetStatement, `s not ast.LetStatement. got=${typeof s}`);
  expect(letStmt.name.value).equal(
    name,
    `letStmt.name.value not ${name}. got=${letStmt.name.value}`
  );
  expect(letStmt.name?.tokenLiteral()).equal(
    name,
    `letStmt.name.tokenLiteral() not ${name}. got=${letStmt.name.tokenLiteral()}`
  );
}

// helper: testIntegerLiteral
function testIntegerLiteral(il: ast.Expression, value: number) {
  let integ = <ast.IntegerLiteral>il;
  expect(integ).to.be.an.instanceof(
    ast.IntegerLiteral,
    `il not ast.IntegerLiteral. got=${typeof il}`
  );

  expect(integ.value).equal(value, `integ.value not ${value}. got=${integ.value}`);
  expect(integ.tokenLiteral()).equal(
    value.toString(),
    `integ.tokenLiteral not ${value}. got=${integ.tokenLiteral()}`
  );
}

// helper: testIdentifier
function testIdentifier(exp: ast.Expression, value: string) {
  let ident = <ast.Identifier>exp;
  expect(ident).to.be.an.instanceof(ast.Identifier, `exp not ast.Identifier. got=${typeof exp}`);

  expect(ident.value).equal(value, `ident.value not ${value}. got=${ident.value}`);
  expect(ident.tokenLiteral()).equal(
    value,
    `ident.tokenLiteral not ${value}. got=${ident.tokenLiteral()}`
  );
}

// helper: testBoolean
function testBooleanLiteral(exp: ast.Expression, value: boolean) {
  let bo = <ast.Boolean>exp;
  expect(bo).to.be.an.instanceof(ast.Boolean, `exp not ast.Boolean. got=${typeof exp}`);

  expect(bo.value).equal(value, `bo.value not ${value}. got=${bo.value}`);
  expect(bo.tokenLiteral()).equal(
    value.toString(),
    `bo.tokenLiteral not ${value}. got=${bo.tokenLiteral()}`
  );
}

// helper: testLiteralExpression
function testLiteralExpression(exp: ast.Expression, expected: any) {
  if (typeof expected === "number") {
    testIntegerLiteral(exp, expected);
  } else if (typeof expected === "string") {
    testIdentifier(exp, expected);
  } else if (typeof expected === "boolean") {
    testBooleanLiteral(exp, expected);
  } else {
    expect(false).equal(true, `type of exp not handled. got=${typeof expected}`);
  }
}

// helper: testInfixExpression
function testInfixExpression(exp: ast.Expression, left: any, operator: string, right: any) {
  let opExp = <ast.InfixExpression>exp;

  expect(exp).to.be.an.instanceof(
    ast.InfixExpression,
    `exp not ast.InfixExpression. got=${typeof exp}`
  );

  testLiteralExpression(opExp.left, left);

  expect(opExp.operator).equal(
    operator,
    `opExp.operator is not ${operator}. got=${opExp.operator}`
  );

  testLiteralExpression(opExp.right, right);
}

// -- ParserTest --
describe("ParserTest", function () {
  // test: LetStatement
  it("testLetStatements", function () {
    class T {
      constructor(
        public input: string,
        public expectedIdentifier: string,
        public expectedValue: any
      ) {}
    }

    let tests: T[] = [
      new T("let x = 5;", "x", 5),
      new T("let y = true;", "y", true),
      new T("let foobar = y", "foobar", "y"),
    ];

    for (let tt of tests) {
      let l = new lexer.Lexer(tt.input);
      let p = new parser.Parser(l);
      let program = p.parseProgram();
      checkParserErrors(p);

      expect(program.statements.length).equal(
        1,
        `program.Statements does not contain 1 statements. got=${program.statements.length}`
      );

      let stmt = program.statements[0];
      testLetStatement(stmt, tt.expectedIdentifier);

      let letStmt = <ast.LetStatement>stmt;
      expect(letStmt).to.be.an.instanceof(
        ast.LetStatement,
        `program.statements[0] not ast.LetStatement. got=${typeof letStmt}`
      );

      let val = letStmt.value;
      testLiteralExpression(val, tt.expectedValue);
    }
  });

  // test: ReturnStatement
  it("testReturnStatements", function () {
    let input = `
      return 5;
      return 10;
      return 993322;
    `;

    let l = new lexer.Lexer(input);
    let p = new parser.Parser(l);
    let program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements.length).equal(
      3,
      `program.Statements does not contain 3 statements. got=${program.statements.length}`
    );

    for (let stmt of program.statements) {
      let returnStmt = <ast.ReturnStatement>stmt;
      expect(stmt).to.be.an.instanceof(
        ast.ReturnStatement,
        `s not ast.ReturnStatement. got=${typeof stmt}`
      );

      expect(returnStmt.tokenLiteral()).equal(
        "return",
        `returmStmt.tokenLiteral not 'return'. got=${returnStmt.tokenLiteral()}`
      );
    }
  });

  // test: Identifier;
  it("testIdentifier", function () {
    let input = `
      foobar
    `;

    let l = new lexer.Lexer(input);
    let p = new parser.Parser(l);
    let program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements.length).equal(
      1,
      `program.Statements does not contain 1 statements. got=${program.statements.length}`
    );

    let stmt = <ast.ExpressionStatement>program.statements[0];
    expect(stmt).to.be.an.instanceof(
      ast.ExpressionStatement,
      `program.statements[0] not ast.ExpressionStatement. got=${typeof stmt}`
    );

    let ident = <ast.Identifier>stmt.expression;
    expect(ident).to.be.an.instanceof(ast.Identifier, `exp not ast.Identifier. got=${ident}`);

    expect(ident.value).equal("foobar", `ident.value not 'foobar'. got=${ident.value}`);
    expect(ident.tokenLiteral()).equal(
      "foobar",
      `ident.tokenLiteral not 'foobar'. got=${ident.tokenLiteral()}`
    );
  });

  // test: IntegerLiteral
  it("testIntegerLiteralExpression", function () {
    let input = `
        5
      `;

    let l = new lexer.Lexer(input);
    let p = new parser.Parser(l);
    let program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements.length).equal(
      1,
      `program.Statements does not contain 1 statements. got=${program.statements.length}`
    );

    let stmt = <ast.ExpressionStatement>program.statements[0];
    expect(stmt).to.be.an.instanceof(
      ast.ExpressionStatement,
      `program.statements[0] not ast.ExpressionStatement. got=${typeof stmt}`
    );

    let literal = <ast.IntegerLiteral>stmt.expression;
    expect(literal).to.be.an.instanceof(
      ast.IntegerLiteral,
      `exp not ast.IntegerLiteral. got=${literal}`
    );

    expect(literal.value).equal(5, `literal.value not 'foobar'. got=${literal.value}`);
    expect(literal.tokenLiteral()).equal(
      "5",
      `literal.tokenLiteral not 'foobar'. got=${literal.tokenLiteral()}`
    );
  });

  // test: PrefixExpression
  it("testParsingPrefixExpressions", function () {
    class T {
      constructor(public input: string, public operator: string, public value: any) {}
    }

    let tests: T[] = [
      new T("!5;", "!", 5),
      new T("-15;", "-", 15),
      new T("!true;", "!", true),
      new T("!false;", "!", false),
    ];

    for (let tt of tests) {
      let l = new lexer.Lexer(tt.input);
      let p = new parser.Parser(l);
      let program = p.parseProgram();
      checkParserErrors(p);

      expect(program.statements.length).equal(
        1,
        `program.Statements does not contain 1 statements. got=${program.statements.length}`
      );

      let stmt = <ast.ExpressionStatement>program.statements[0];
      expect(stmt).to.be.an.instanceof(
        ast.ExpressionStatement,
        `program.statements[0] not ast.ExpressionStatement. got=${typeof stmt}`
      );

      let exp = <ast.PrefixExpression>stmt.expression;
      expect(exp).to.be.an.instanceof(
        ast.PrefixExpression,
        `exp not ast.PrefixExpression. got=${exp}`
      );

      expect(exp.operator).equal(
        tt.operator,
        `exp.operator not '${tt.operator}'. got=${exp.operator}`
      );

      testLiteralExpression(exp.right, tt.value);
    }
  });

  // test: InfixExpression
  it("testParsingInfixExpressions", function () {
    class T {
      constructor(
        public input: string,
        public leftValue: any,
        public operator: string,
        public rightValue: any
      ) {}
    }

    let tests: T[] = [
      new T("5 + 5;", 5, "+", 5),
      new T("5 - 5;", 5, "-", 5),
      new T("5 * 5;", 5, "*", 5),
      new T("5 / 5;", 5, "/", 5),
      new T("5 > 5;", 5, ">", 5),
      new T("5 < 5;", 5, "<", 5),
      new T("5 == 5;", 5, "==", 5),
      new T("5 != 5;", 5, "!=", 5),
      new T("true == true", true, "==", true),
      new T("true != false", true, "!=", false),
      new T("false == false", false, "==", false),
    ];

    for (let tt of tests) {
      let l = new lexer.Lexer(tt.input);
      let p = new parser.Parser(l);
      let program = p.parseProgram();
      checkParserErrors(p);

      expect(program.statements.length).equal(
        1,
        `program.Statements does not contain 1 statements. got=${program.statements.length}`
      );

      let stmt = <ast.ExpressionStatement>program.statements[0];
      expect(stmt).to.be.an.instanceof(
        ast.ExpressionStatement,
        `program.statements[0] not ast.ExpressionStatement. got=${typeof stmt}`
      );

      let exp = <ast.InfixExpression>stmt.expression;
      expect(exp).to.be.an.instanceof(
        ast.InfixExpression,
        `exp not ast.InfixExpression. got=${exp}`
      );

      testLiteralExpression(exp.left, tt.leftValue);

      expect(exp.operator).equal(
        tt.operator,
        `exp.operator not '${tt.operator}'. got=${exp.operator}`
      );

      testLiteralExpression(exp.right, tt.rightValue);
    }
  });

  // test: PrefixExpressioin and InfixExpression
  it("testOperatorPrecedenceParsing", function () {
    class T {
      constructor(public input: string, public expected: string) {}
    }

    let tests: T[] = [
      new T("-a * b", "((-a) * b)"),
      new T("!-a", "(!(-a))"),
      new T("a + b + c", "((a + b) + c)"),
      new T("a + b - c", "((a + b) - c)"),
      new T("a * b * c", "((a * b) * c)"),
      new T("a * b / c", "((a * b) / c)"),
      new T("a + b / c", "(a + (b / c))"),
      new T("a + b * c + d / e - f", "(((a + (b * c)) + (d / e)) - f)"),
      new T("3 + 4; -5 * 5", "(3 + 4)((-5) * 5)"),
      new T("5 > 4 == 3 < 4", "((5 > 4) == (3 < 4))"),
      new T("5 < 4 != 3 > 4", "((5 < 4) != (3 > 4))"),
      new T("3 + 4 * 5 == 3 * 1 + 4 * 5", "((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))"),
      new T("3 + 4 * 5 == 3 * 1 + 4 * 5", "((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))"),
      new T("true", "true"),
      new T("false", "false"),
      new T("3 > 5 == false", "((3 > 5) == false)"),
      new T("3 < 5 == true", "((3 < 5) == true)"),
      new T("1 + (2 + 3) + 4", "((1 + (2 + 3)) + 4)"),
      new T("(5 + 5) * 2", "((5 + 5) * 2)"),
      new T("2 / (5 + 5)", "(2 / (5 + 5))"),
      new T("-(5 + 5)", "(-(5 + 5))"),
      new T("!(true == true)", "(!(true == true))"),
      new T("a + add(b * c) + d", "((a + add((b * c))) + d)"),
      new T(
        "add(a, b, 1, 2 * 3, 4 + 5, add(6, 7 * 8))",
        "add(a, b, 1, (2 * 3), (4 + 5), add(6, (7 * 8)))"
      ),
      new T("add(a + b + c * d / f + g)", "add((((a + b) + ((c * d) / f)) + g))"),
      new T("a * [1, 2, 3, 4][b * c] * d", "((a * ([1, 2, 3, 4][(b * c)])) * d)"),
      new T("add(a * b[2], b[1], 2 * [1, 2][1])", "add((a * (b[2])), (b[1]), (2 * ([1, 2][1])))"),
    ];

    for (let tt of tests) {
      let l = new lexer.Lexer(tt.input);
      let p = new parser.Parser(l);
      let program = p.parseProgram();
      checkParserErrors(p);
      let actual = program.string();
      expect(actual).equal(tt.expected, `expected=${tt.expected}, got=${actual}`);
    }
  });

  // test: Boolean
  it("testBooleanExpression", function () {
    class T {
      constructor(public input: string, public expectedBoolean: boolean) {}
    }

    let tests: T[] = [new T("true", true), new T("false", false)];

    for (let tt of tests) {
      let l = new lexer.Lexer(tt.input);
      let p = new parser.Parser(l);
      let program = p.parseProgram();
      checkParserErrors(p);

      expect(program.statements.length).equal(
        1,
        `program.Statements does not contain 1 statements. got=${program.statements.length}`
      );

      let stmt = <ast.ExpressionStatement>program.statements[0];
      expect(stmt).to.be.an.instanceof(
        ast.ExpressionStatement,
        `program.statements[0] not ast.ExpressionStatement. got=${typeof stmt}`
      );

      let boolean = <ast.Boolean>stmt.expression;
      expect(boolean).to.be.an.instanceof(
        ast.Boolean,
        `exp not ast.PrefixExpression. got=${boolean}`
      );

      expect(boolean.value).equal(
        tt.expectedBoolean,
        `boolean.value not ${tt.expectedBoolean}. got=${boolean.value}`
      );
    }
  });

  // test: IfExpression
  it("testIfExpression", function () {
    let input = `
      if (x < y) { x }
    `;

    let l = new lexer.Lexer(input);
    let p = new parser.Parser(l);
    let program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements.length).equal(
      1,
      `program.Statements does not contain 1 statements. got=${program.statements.length}`
    );

    let stmt = <ast.ExpressionStatement>program.statements[0];
    expect(stmt).to.be.an.instanceof(
      ast.ExpressionStatement,
      `program.statements[0] not ast.ExpressionStatement. got=${typeof stmt}`
    );

    let exp = <ast.IfExpression>stmt.expression;
    expect(exp).to.be.an.instanceof(ast.IfExpression, `exp not ast.IfExpression. got=${exp}`);

    testInfixExpression(exp.condition, "x", "<", "y");

    expect(exp.consequence.statements.length).equal(
      1,
      `consequence does not contain 1 statements. got=${exp.consequence.statements.length}`
    );
    let consequence = <ast.ExpressionStatement>exp.consequence.statements[0];
    expect(consequence).to.be.an.instanceof(
      ast.ExpressionStatement,
      `consequence not ast.ExpressionStatement. got=${consequence}`
    );

    testIdentifier(consequence.expression, "x");
    expect(exp.alternative).equal(undefined, `exp.alternative is not null, got=${exp.alternative}`);
  });

  // test: IfExpression (Else)
  it("testIfElseExpression", function () {
    let input = `
        if (x < y) { x } else {y}
      `;

    let l = new lexer.Lexer(input);
    let p = new parser.Parser(l);
    let program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements.length).equal(
      1,
      `program.Statements does not contain 1 statements. got=${program.statements.length}`
    );

    let stmt = <ast.ExpressionStatement>program.statements[0];
    expect(stmt).to.be.an.instanceof(
      ast.ExpressionStatement,
      `program.statements[0] not ast.ExpressionStatement. got=${typeof stmt}`
    );

    let exp = <ast.IfExpression>stmt.expression;
    expect(exp).to.be.an.instanceof(ast.IfExpression, `exp not ast.IfExpression. got=${exp}`);

    testInfixExpression(exp.condition, "x", "<", "y");

    expect(exp.consequence.statements.length).equal(
      1,
      `consequence does not contain 1 statements. got=${exp.consequence.statements.length}`
    );
    let consequence = <ast.ExpressionStatement>exp.consequence.statements[0];
    expect(consequence).to.be.an.instanceof(
      ast.ExpressionStatement,
      `consequence not ast.ExpressionStatement. got=${consequence}`
    );

    testIdentifier(consequence.expression, "x");

    expect(exp.alternative?.statements.length).equal(
      1,
      `alternative does not contain 1 statements. got=${exp.consequence.statements.length}`
    );
    let alterative = <ast.ExpressionStatement>exp.alternative?.statements[0];
    expect(alterative).to.be.an.instanceof(
      ast.ExpressionStatement,
      `alternative not ast.ExpressionStatement. got=${alterative}`
    );

    testIdentifier(alterative.expression, "y");
  });

  // test: FunctionLiteral
  it("testFunctionLiteralParsing", function () {
    let input = `
      fn(x, y) { x + y; }
    `;

    let l = new lexer.Lexer(input);
    let p = new parser.Parser(l);
    let program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements.length).equal(
      1,
      `program.Statements does not contain 1 statements. got=${program.statements.length}`
    );

    let stmt = <ast.ExpressionStatement>program.statements[0];
    expect(stmt).to.be.an.instanceof(
      ast.ExpressionStatement,
      `program.statements[0] not ast.ExpressionStatement. got=${typeof stmt}`
    );

    let func = <ast.FunctionLiteral>stmt.expression;
    expect(func).to.be.an.instanceof(
      ast.FunctionLiteral,
      `exp not ast.FunctionLiteral. got=${func}`
    );

    expect(func.parameters.length).equal(2, `parameters is not 2. got=${func.parameters.length}`);

    testLiteralExpression(func.parameters[0], "x");
    testLiteralExpression(func.parameters[1], "y");

    expect(func.body.statements.length).equal(
      1,
      `parameters is not 2. got=${func.body.statements.length}`
    );

    let bodyStmt = <ast.ExpressionStatement>func.body.statements[0];
    expect(bodyStmt).to.be.an.instanceof(
      ast.ExpressionStatement,
      `body.statements[0] not ast.ExpressionStatement. got=${typeof bodyStmt}`
    );

    testInfixExpression(bodyStmt.expression, "x", "+", "y");
  });

  // test: FunctionLiteral (Parameter)
  it("testFunctionParameterParsing", function () {
    class T {
      constructor(public input: string, public expectedParams: string[]) {}
    }

    let tests: T[] = [
      new T("fn() {};", []),
      new T("fn(x) {};", ["x"]),
      new T("fn(x, y, z) {};", ["x", "y", "z"]),
    ];

    for (let tt of tests) {
      let l = new lexer.Lexer(tt.input);
      let p = new parser.Parser(l);
      let program = p.parseProgram();
      checkParserErrors(p);

      expect(program.statements.length).equal(
        1,
        `program.Statements does not contain 1 statements. got=${program.statements.length}`
      );

      let stmt = <ast.ExpressionStatement>program.statements[0];
      expect(stmt).to.be.an.instanceof(
        ast.ExpressionStatement,
        `program.statements[0] not ast.ExpressionStatement. got=${typeof stmt}`
      );

      let func = <ast.FunctionLiteral>stmt.expression;
      expect(func).to.be.an.instanceof(
        ast.FunctionLiteral,
        `exp not ast.FunctionLiteral. got=${func}`
      );

      expect(func.parameters.length).equal(
        tt.expectedParams.length,
        `func.parameters length not '${tt.expectedParams.length}'. got=${func.parameters.length}`
      );

      tt.expectedParams.forEach((ident, i) => {
        testLiteralExpression(func.parameters[i], ident);
      });
    }
  });

  // test: CallExpression
  it("testCallExpressionParsing", function () {
    let input = `
      add(1, 2 * 3, 4 + 5);
    `;

    let l = new lexer.Lexer(input);
    let p = new parser.Parser(l);
    let program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements.length).equal(
      1,
      `program.Statements does not contain 1 statements. got=${program.statements.length}`
    );

    let stmt = <ast.ExpressionStatement>program.statements[0];
    expect(stmt).to.be.an.instanceof(
      ast.ExpressionStatement,
      `program.statements[0] not ast.ExpressionStatement. got=${typeof stmt}`
    );

    let exp = <ast.CallExpression>stmt.expression;
    expect(exp).to.be.an.instanceof(ast.CallExpression, `exp not ast.FunctionLiteral. got=${exp}`);

    testIdentifier(exp.function, "add");

    expect(exp.arguments.length).equal(
      3,
      `exp.arguments.length not 3. got=${exp.arguments.length}`
    );

    testLiteralExpression(exp.arguments[0], 1);
    testInfixExpression(exp.arguments[1], 2, "*", 3);
    testInfixExpression(exp.arguments[2], 4, "+", 5);
  });

  // test: ArrayLiteral
  it("testParsingArrayLiterals", function () {
    let input = `
      [1, 2 * 2, 3 + 3]
    `;

    let l = new lexer.Lexer(input);
    let p = new parser.Parser(l);
    let program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements.length).equal(
      1,
      `program.Statements does not contain 1 statements. got=${program.statements.length}`
    );

    let stmt = <ast.ExpressionStatement>program.statements[0];
    expect(stmt).to.be.an.instanceof(
      ast.ExpressionStatement,
      `program.statements[0] not ast.ExpressionStatement. got=${typeof stmt}`
    );

    let array = <ast.ArrayLiteral>stmt.expression;
    expect(array).to.be.an.instanceof(ast.ArrayLiteral, `exp not ast.ArrayLiteral. got=${array}`);
    expect(array.elements.length).equal(
      3,
      `exp.arguments.length not 3. got=${array.elements.length}`
    );
    testIntegerLiteral(array.elements[0], 1);
    testInfixExpression(array.elements[1], 2, "*", 2);
    testInfixExpression(array.elements[2], 3, "+", 3);
  });

  // test: IndexExpression
  it("testParsingIndexExpressions", function () {
    let input = `
      myArray[1 + 1]
    `;

    let l = new lexer.Lexer(input);
    let p = new parser.Parser(l);
    let program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements.length).equal(
      1,
      `program.Statements does not contain 1 statements. got=${program.statements.length}`
    );

    let stmt = <ast.ExpressionStatement>program.statements[0];
    expect(stmt).to.be.an.instanceof(
      ast.ExpressionStatement,
      `program.statements[0] not ast.ExpressionStatement. got=${typeof stmt}`
    );

    let indexExp = <ast.IndexExpression>stmt.expression;
    expect(indexExp).to.be.an.instanceof(
      ast.IndexExpression,
      `exp not ast.IndexExpression. got=${indexExp}`
    );

    testIdentifier(indexExp.left, "myArray");
    testInfixExpression(indexExp.index, 1, "+", 1);
  });

  // test: HashLiteral
  it("testParsingHashLiteralsStringKeys", function () {
    let input = `
        {"one": 1, "two": 2, "three": 3}
      `;

    let l = new lexer.Lexer(input);
    let p = new parser.Parser(l);
    let program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements.length).equal(
      1,
      `program.Statements does not contain 1 statements. got=${program.statements.length}`
    );

    let stmt = <ast.ExpressionStatement>program.statements[0];
    expect(stmt).to.be.an.instanceof(
      ast.ExpressionStatement,
      `program.statements[0] not ast.ExpressionStatement. got=${typeof stmt}`
    );

    let hash = <ast.HashLiteral>stmt.expression;
    expect(hash).to.be.an.instanceof(ast.HashLiteral, `exp not ast.IndexExpression. got=${hash}`);
    expect(hash.pairs.length).equal(3, `hash.pairs ength not 3. got=${hash.pairs.length}`);
    let expected: { [key: string]: number } = {
      one: 1,
      two: 2,
      three: 3,
    };

    for (let p of hash.pairs) {
      let key = <ast.StringLiteral>p.keyNode;
      expect(key).to.be.an.instanceof(ast.StringLiteral, `key not ast.StringLiteral. got=${key}`);
      let expectedVal = expected[key.value];
      testIntegerLiteral(p.valueNode, expectedVal);
    }
  });

  // test: HashLiteral (Empty)
  it("testParsingEmptyHashLiteral", function () {
    let input = `
        {}
      `;

    let l = new lexer.Lexer(input);
    let p = new parser.Parser(l);
    let program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements.length).equal(
      1,
      `program.Statements does not contain 1 statements. got=${program.statements.length}`
    );

    let stmt = <ast.ExpressionStatement>program.statements[0];
    expect(stmt).to.be.an.instanceof(
      ast.ExpressionStatement,
      `program.statements[0] not ast.ExpressionStatement. got=${typeof stmt}`
    );

    let hash = <ast.HashLiteral>stmt.expression;
    expect(hash).to.be.an.instanceof(ast.HashLiteral, `exp not ast.IndexExpression. got=${hash}`);
    expect(hash.pairs.length).equal(0, `hash.pairs length not 0. got=${hash.pairs.length}`);
  });

  // test: HashLiteral (Expression)
  it("testParsingHashLiteralsWithExpressions", function () {
    let input = `
      {"one": 0 + 1, "two": 10 - 8, "three": 15 / 5}
    `;

    let l = new lexer.Lexer(input);
    let p = new parser.Parser(l);
    let program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements.length).equal(
      1,
      `program.Statements does not contain 1 statements. got=${program.statements.length}`
    );

    let stmt = <ast.ExpressionStatement>program.statements[0];
    expect(stmt).to.be.an.instanceof(
      ast.ExpressionStatement,
      `program.statements[0] not ast.ExpressionStatement. got=${typeof stmt}`
    );

    let hash = <ast.HashLiteral>stmt.expression;
    expect(hash).to.be.an.instanceof(ast.HashLiteral, `exp not ast.IndexExpression. got=${hash}`);
    expect(hash.pairs.length).equal(3, `hash.pairs length not 3. got=${hash.pairs.length}`);

    type F = (e: ast.Expression) => void;

    let expected: { [key: string]: F } = {
      one: (e) => {
        testInfixExpression(e, 0, "+", 1);
      },
      two: (e) => {
        testInfixExpression(e, 10, "-", 8);
      },
      three: (e) => {
        testInfixExpression(e, 15, "/", 5);
      },
    };

    for (let p of hash.pairs) {
      let key = <ast.StringLiteral>p.keyNode;
      expect(key).to.be.an.instanceof(ast.StringLiteral, `key not ast.StringLiteral. got=${key}`);
      let testFn = expected[key.value];
      testFn(p.valueNode);
    }
  });
  //end
});
