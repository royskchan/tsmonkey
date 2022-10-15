import { expect } from "chai";
import * as token from "../token/token";
import * as ast from "./ast";

describe("AstTest", function () {
  // test: testString
  it("testString", function () {
    let program = new ast.Program();
    program.statements = [
      new ast.LetStatement(
        { type: token.LET, literal: "let" },
        new ast.Identifier({ type: token.IDENT, literal: "myVar" }, "myVar"),
        new ast.Identifier({ type: token.IDENT, literal: "anotherVar" }, "anotherVar")
      ),
    ];
    expect(program.string()).equal(
      "let myVar = anotherVar;",
      `program.string() wong. got=${program.string()}`
    );
  });
});
