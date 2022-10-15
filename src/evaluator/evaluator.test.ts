import { expect } from "chai";
import * as object from "../object/object";
import * as lexer from "../lexer/lexer";
import * as parser from "../parser/parser";
import * as evaluator from "../evaluator/evaluator";
import { TRUE } from "../token/token";

// helper: testEval
function testEval(input: string): object.Object | null {
  let l = new lexer.Lexer(input);
  let p = new parser.Parser(l);
  let program = p.parseProgram();
  let e = new evaluator.Evaluator();
  let env = new object.Environment();
  return e.eval(program, env);
}

// helper: testIntegerObject
function testIntegerObject(obj: object.Object | null, expected: number) {
  let result = <object.Integer>obj;
  expect(result).to.be.an.instanceof(object.Integer, `object not Integer. got=${typeof obj}`);
  expect(result.value).equal(
    expected,
    `object has wrong value expected = ${expected}. got=${result.value}`
  );
}

// helper: testBooleanObject
function testBooleanObject(obj: object.Object | null, expected: boolean) {
  let result = <object.Boolean>obj;
  expect(result).to.be.an.instanceof(object.Boolean, `object not Boolean. got=${typeof obj}`);
  expect(result.value).equal(
    expected,
    `object has wrong value expected = ${expected}. got=${result.value}`
  );
}

// helper: testNullObject
function testNullObject(obj: object.Object | null) {
  expect(obj).equal(evaluator.NULL, `object is not NULL, got=${typeof obj}`);
}

// -- EvaluatorTest --
describe("EvaluatorTest", function () {
  // test: Integer
  it("testEvalIntegerExpression", function () {
    class T {
      constructor(public input: string, public expected: number) {}
    }

    let tests: T[] = [new T("5", 5), new T("10", 10), new T("-5", -5), new T("-10", -10)];

    for (let tt of tests) {
      let evaluated = testEval(tt.input);
      testIntegerObject(evaluated, tt.expected);
    }
  });

  // test: Boolean
  it("testEvalBooleanExpression", function () {
    class T {
      constructor(public input: string, public expected: boolean) {}
    }

    let tests: T[] = [
      new T("true", true),
      new T("false", false),
      new T("1 < 2", true),
      new T("1 > 2", false),
      new T("1 < 1", false),
      new T("1 > 1", false),
      new T("1 == 1", true),
      new T("1 != 1", false),
      new T("1 == 2", false),
      new T("1 != 2", true),
      new T("true == true", true),
      new T("false == false", true),
      new T("true == false", false),
      new T("true != false", true),
      new T("false != true", true),
      new T("(1 < 2) == true", true),
      new T("(1 < 2) == false", false),
      new T("(1 > 2) == true", false),
      new T("(1 > 2) == false", true),
    ];

    for (let tt of tests) {
      let evaluated = testEval(tt.input);
      testBooleanObject(evaluated, tt.expected);
    }
  });

  // test: PrefixExpression (!)
  it("testBangOperator", function () {
    class T {
      constructor(public input: string, public expected: boolean) {}
    }

    let tests: T[] = [
      new T("!true", false),
      new T("!false", true),
      new T("!5", false),
      new T("!!true", true),
      new T("!!false", false),
      new T("!!5", true),
    ];

    for (let tt of tests) {
      let evaluated = testEval(tt.input);
      testBooleanObject(evaluated, tt.expected);
    }
  });

  // test: InfixExpression (Integer)
  it("testEvalIntegerExpression", function () {
    class T {
      constructor(public input: string, public expected: number) {}
    }

    let tests: T[] = [
      new T("5", 5),
      new T("10", 10),
      new T("-5", -5),
      new T("-10", -10),
      new T("5 + 5 + 5 + 5 - 10", 10),
      new T("2 * 2 * 2 * 2 * 2", 32),
      new T("-50 + 100 + -50", 0),
      new T("5 * 2 + 10", 20),
      new T("5 + 2 * 10", 25),
      new T("20 + 2 * -10", 0),
      new T("50 / 2 * 2 + 10", 60),
      new T("2 * (5 + 10)", 30),
      new T("3 * 3 * 3 + 10", 37),
      new T("3 * (3 * 3) + 10", 37),
      new T("(5 + 10 * 2 + 15 / 3) * 2 + -10", 50),
    ];

    for (let tt of tests) {
      let evaluated = testEval(tt.input);
      testIntegerObject(evaluated, tt.expected);
    }
  });

  // test: IfExpression
  it("testIfElseExpressions", function () {
    class T {
      constructor(public input: string, public expected: any) {}
    }

    let tests: T[] = [
      new T("if (true) { 10 }", 10),
      new T("if (false) { 10 }", null),
      new T("if (1) { 10 }", 10),
      new T("if (1 < 2) { 10 }", 10),
      new T("if (1 > 2) { 10 }", null),
      new T("if (1 > 2) { 10 } else { 20 }", 20),
      new T("if (1 < 2) { 10 } else { 20 }", 10),
    ];

    for (let tt of tests) {
      let evaluated = testEval(tt.input);
      if (typeof tt.expected === "number") {
        testIntegerObject(evaluated, tt.expected);
      } else {
        testNullObject(evaluated);
      }
    }
  });

  // test: ReturnValue
  it("testReturnStatements", function () {
    class T {
      constructor(public input: string, public expected: number) {}
    }

    let tests: T[] = [
      new T("return 10;", 10),
      new T("return 10; 9;", 10),
      new T("return 2 * 5; 9;", 10),
      new T("9; return 2 * 5; 9;", 10),
      new T(
        `if (10 > 1) {
          if (10 > 1) {
            return 10;
          }
          return 1;
        }`,
        10
      ),
    ];

    for (let tt of tests) {
      let evaluated = testEval(tt.input);
      testIntegerObject(evaluated, tt.expected);
    }
  });

  // test: Error
  it("testErrorHandling", function () {
    class T {
      constructor(public input: string, public expectedMessage: string) {}
    }

    let tests: T[] = [
      new T("5 + true;", "type mismatch: INTEGER + BOOLEAN"),
      new T("5 + true; 5;", "type mismatch: INTEGER + BOOLEAN"),
      new T("-true", "unknown operator: -BOOLEAN"),
      new T("true + false;", "unknown operator: BOOLEAN + BOOLEAN"),
      new T("5; true + false; 5", "unknown operator: BOOLEAN + BOOLEAN"),
      new T("if (10 > 1) { true + false; }", "unknown operator: BOOLEAN + BOOLEAN"),
      new T(
        `
          if (10 > 1) {
            if (10 > 1) {
              return true + false;
            }
            return 1;
          } 
      `,
        "unknown operator: BOOLEAN + BOOLEAN"
      ),
      new T("foobar", "identifier not found: foobar"),
      new T(`"Hello" - "World;"`, "unknown operator: STRING - STRING"),
      new T(`{"name": "Monkey"}[fn(x) { x }];`, "unusable as hash key: FUNCTION"),
    ];

    for (let tt of tests) {
      let evaluated = testEval(tt.input);
      let errObj = <object.Error>evaluated;
      expect(evaluated).to.be.an.instanceof(
        object.Error,
        `object not Error. got=${typeof evaluated}`
      );
      expect(errObj.message).equal(
        tt.expectedMessage,
        `wrong error message. expect=${tt.expectedMessage}. got=${errObj.message}`
      );
    }
  });

  // test: LetStatement
  it("testLetStatements", function () {
    class T {
      constructor(public input: string, public expected: number) {}
    }

    let tests: T[] = [
      new T("let a = 5; a;", 5),
      new T("let a = 5 * 5; a;", 25),
      new T("let a = 5; let b = a; b;", 5),
      new T("let a = 5; let b = a; let c = a + b + 5; c;", 15),
    ];

    for (let tt of tests) {
      let evaluated = testEval(tt.input);
      testIntegerObject(evaluated, tt.expected);
    }
  });

  // test: Function
  it("testFunctionObject", function () {
    let input = `
        fn(x) { x + 2; };
      `;

    let evaluated = testEval(input);
    let fn = <object.Function>evaluated;
    expect(evaluated).to.be.an.instanceof(
      object.Function,
      `object is not Function. got=${typeof evaluated}`
    );
    expect(fn.parameters.length).equal(
      1,
      `num of parameters is wrong. expect=${1}. got=${fn.parameters.length}`
    );

    expect(fn.parameters[0].string()).equal(
      "x",
      `parameter is wrong. expect=${"x"}. got=${fn.parameters[0].string()}`
    );

    expect(fn.body.string()).equal(
      "(x + 2)",
      `body is wrong. expect=${"(x + 2)"}. got=${fn.body.string()}`
    );
  });

  // test: Function (value)
  it("testFunctionApplication", function () {
    class T {
      constructor(public input: string, public expected: number) {}
    }

    let tests: T[] = [
      new T("let identity = fn(x) { x; }; identity(5);", 5),
      new T("let identity = fn(x) { return x; }; identity(5);", 5),
      new T("let double = fn(x) { x * 2; }; double(5);", 10),
      new T("let add = fn(x, y) { x + y; }; add(5, 5);", 10),
      new T("let add = fn(x, y) { x + y; }; add(5 + 5, add(5, 5));", 20),
      new T("fn(x) { x; }(5)", 5),
    ];

    for (let tt of tests) {
      let evaluated = testEval(tt.input);
      testIntegerObject(evaluated, tt.expected);
    }
  });

  // test: Function (closure)
  it("testClosures", function () {
    let input = `
      let newAdder = fn(x) {
        fn(y) { x + y };
        };
      let addTwo = newAdder(2);
      addTwo(2);
    `;

    let evaluated = testEval(input);
    testIntegerObject(evaluated, 4);
  });

  // test: String
  it("testStringLiteral", function () {
    let input = `
      "Hello World!"
    `;

    let evaluated = testEval(input);
    let str = <object.String>evaluated;
    expect(evaluated).to.be.an.instanceof(
      object.String,
      `object is not String. got=${typeof evaluated}`
    );
    expect(str.value).equal(
      "Hello World!",
      `body is wrong. expect=${"Hello World!"}. got=${str.value}`
    );
  });

  // test: String (concat)
  it("testStringConcatenation", function () {
    let input = `
      "Hello" + " " + "World!"
    `;

    let evaluated = testEval(input);
    let str = <object.String>evaluated;
    expect(evaluated).to.be.an.instanceof(
      object.String,
      `object is not String. got=${typeof evaluated}`
    );
    expect(str.value).equal(
      "Hello World!",
      `body is wrong. expect=${"Hello World!"}. got=${str.value}`
    );
  });

  // test: Buildin
  it("testBuiltinFunctions", function () {
    class T {
      constructor(public input: string, public expected: any) {}
    }

    let tests: T[] = [
      new T(`len("")`, 0),
      new T(`len("four")`, 4),
      new T(`len("hello world")`, 11),
      new T(`len(1)`, "argument to `len` not supported, got INTEGER"),
      new T(`len("one", "two")`, "wrong number of arguments. got=2, want=1"),
    ];

    for (let tt of tests) {
      let evaluated = testEval(tt.input);
      if (typeof tt.expected === "number") {
        testIntegerObject(evaluated, tt.expected);
      } else if (typeof tt.expected === "string") {
        let errObj = <object.Error>evaluated;
        expect(evaluated).to.be.an.instanceof(
          object.Error,
          `object is not Error. got=${typeof evaluated}`
        );
        expect(errObj.message).equal(
          tt.expected,
          `body is wrong. expect=${tt.expected}. got=${errObj.message}`
        );
      }
    }
  });

  // test: ArrayLiteral
  it("testArrayLiterals", function () {
    let input = `
      [1, 2 * 2, 3 + 3]
    `;

    let evaluated = testEval(input);
    let result = <object.Array>evaluated;
    expect(evaluated).to.be.an.instanceof(
      object.Array,
      `object is not String. got=${typeof evaluated}`
    );
    expect(result.elements.length).equal(
      3,
      `exp.arguments.length not 3. got=${result.elements.length}`
    );
    testIntegerObject(result.elements[0], 1);
    testIntegerObject(result.elements[1], 4);
    testIntegerObject(result.elements[2], 6);
  });

  // test: IndexExpression
  it("testArrayIndexExpressions", function () {
    class T {
      constructor(public input: string, public expected: any) {}
    }

    let tests: T[] = [
      new T("[1, 2, 3][0]", 1),
      new T("[1, 2, 3][1]", 2),
      new T("[1, 2, 3][2]", 3),
      new T("let i = 0; [1][i];", 1),
      new T("[1, 2, 3][1 + 1];", 3),
      new T("let myArray = [1, 2, 3]; myArray[2];", 3),
      new T("let myArray = [1, 2, 3]; myArray[0] + myArray[1] + myArray[2];", 6),
      new T("let myArray = [1, 2, 3]; let i = myArray[0]; myArray[i]", 2),
      new T("[1, 2, 3][3]", null),
      new T("[1, 2, 3][-1]", null),
    ];

    for (let tt of tests) {
      let evaluated = testEval(tt.input);
      if (typeof tt.expected === "number") {
        testIntegerObject(evaluated, tt.expected);
      } else {
        testNullObject(evaluated);
      }
    }
  });

  // test: Hash
  it("testHashLiterals", function () {
    let input = `
      let two = "two";
      {
        "one": 10 - 9,
        two: 1 + 1,
        "thr" + "ee": 6 / 2,
        4: 4,
        true: 5,
        false: 6
      }
    `;

    let evaluated = testEval(input);
    let result = <object.Hash>evaluated;
    expect(evaluated).to.be.an.instanceof(
      object.Hash,
      `object is not Hash. got=${typeof evaluated}`
    );
    let expected: { [key: string]: number } = {};
    expected[new object.String("one").hashKey()] = 1;
    expected[new object.String("two").hashKey()] = 2;
    expected[new object.String("three").hashKey()] = 3;
    expected[new object.Integer(4).hashKey()] = 4;
    expected[evaluator.TRUE.hashKey()] = 5;
    expected[evaluator.FALSE.hashKey()] = 6;

    expect(Object.keys(result.pairs).length).equal(
      Object.keys(expected).length,
      `Hash has wrong numbers of pairs.expect=${Object.keys(expected).length}. got=${
        Object.keys(result.pairs).length
      }`
    );

    for (let expectedKey in expected) {
      let expectedValue = expected[expectedKey];
      let pair = result.pairs[expectedKey];
      expect(pair !== undefined).equal(true, `no pair for key=${expectedKey} in pairs`);
      testIntegerObject(pair.value, expectedValue);
    }
  });

  // test: Hash (IndexExpression)
  it("testHashIndexExpressions", function () {
    class T {
      constructor(public input: string, public expected: any) {}
    }

    let tests: T[] = [
      new T(`{"foo": 5}["foo"]`, 5),
      new T(`{"foo": 5}["bar"]`, null),
      new T(`let key = "foo"; {"foo": 5}[key]`, 5),
      new T(`{}["foo"]`, null),
      new T(`{5: 5}[5]`, 5),
      new T(`{true: 5}[true]`, 5),
      new T(`{false: 5}[false]`, 5),
    ];

    for (let tt of tests) {
      let evaluated = testEval(tt.input);
      if (typeof tt.expected === "number") {
        testIntegerObject(evaluated, tt.expected);
      } else {
        testNullObject(evaluated);
      }
    }
  });
  //end
});
