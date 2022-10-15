import { expect } from "chai";
import * as token from "../token/token";
import * as lexer from "./lexer";

describe("LexerTest", function () {
  it("testNextToken", function () {
    let input = `
      let five = 5;
      let ten = 10;
      let add = fn(x, y) {
        x + y;
      };
      let result = add(five, ten);
      !-/*5;
      5 < 10 > 5;

      if (5 < 10) {
        return true;
        } else {
        return false;
      }

      10 == 10;
      10 != 9;
      "foobar"
      "foo bar"
      [1, 2];
      {"foo": "bar"}
    `;

    class T {
      constructor(public expectedType: string, public expectedLiteral: string) {}
    }

    let tests: T[] = [
      new T(token.LET, "let"),
      new T(token.IDENT, "five"),
      new T(token.ASSIGN, "="),
      new T(token.INT, "5"),
      new T(token.SEMICOLON, ";"),
      new T(token.LET, "let"),
      new T(token.IDENT, "ten"),
      new T(token.ASSIGN, "="),
      new T(token.INT, "10"),
      new T(token.SEMICOLON, ";"),
      new T(token.LET, "let"),
      new T(token.IDENT, "add"),
      new T(token.ASSIGN, "="),
      new T(token.FUNCTION, "fn"),
      new T(token.LPAREN, "("),
      new T(token.IDENT, "x"),
      new T(token.COMMA, ","),
      new T(token.IDENT, "y"),
      new T(token.RPAREN, ")"),
      new T(token.LBRACE, "{"),
      new T(token.IDENT, "x"),
      new T(token.PLUS, "+"),
      new T(token.IDENT, "y"),
      new T(token.SEMICOLON, ";"),
      new T(token.RBRACE, "}"),
      new T(token.SEMICOLON, ";"),
      new T(token.LET, "let"),
      new T(token.IDENT, "result"),
      new T(token.ASSIGN, "="),
      new T(token.IDENT, "add"),
      new T(token.LPAREN, "("),
      new T(token.IDENT, "five"),
      new T(token.COMMA, ","),
      new T(token.IDENT, "ten"),
      new T(token.RPAREN, ")"),
      new T(token.SEMICOLON, ";"),
      new T(token.BANG, "!"),
      new T(token.MINUS, "-"),
      new T(token.SLASH, "/"),
      new T(token.ASTERISK, "*"),
      new T(token.INT, "5"),
      new T(token.SEMICOLON, ";"),
      new T(token.INT, "5"),
      new T(token.LT, "<"),
      new T(token.INT, "10"),
      new T(token.GT, ">"),
      new T(token.INT, "5"),
      new T(token.SEMICOLON, ";"),
      new T(token.IF, "if"),
      new T(token.LPAREN, "("),
      new T(token.INT, "5"),
      new T(token.LT, "<"),
      new T(token.INT, "10"),
      new T(token.RPAREN, ")"),
      new T(token.LBRACE, "{"),
      new T(token.RETURN, "return"),
      new T(token.TRUE, "true"),
      new T(token.SEMICOLON, ";"),
      new T(token.RBRACE, "}"),
      new T(token.ELSE, "else"),
      new T(token.LBRACE, "{"),
      new T(token.RETURN, "return"),
      new T(token.FALSE, "false"),
      new T(token.SEMICOLON, ";"),
      new T(token.RBRACE, "}"),
      new T(token.INT, "10"),
      new T(token.EQ, "=="),
      new T(token.INT, "10"),
      new T(token.SEMICOLON, ";"),
      new T(token.INT, "10"),
      new T(token.NOT_EQ, "!="),
      new T(token.INT, "9"),
      new T(token.SEMICOLON, ";"),
      new T(token.STRING, "foobar"),
      new T(token.STRING, "foo bar"),
      new T(token.LBRACKET, "["),
      new T(token.INT, "1"),
      new T(token.COMMA, ","),
      new T(token.INT, "2"),
      new T(token.RBRACKET, "]"),
      new T(token.SEMICOLON, ";"),
      new T(token.LBRACE, "{"),
      new T(token.STRING, "foo"),
      new T(token.COLON, ":"),
      new T(token.STRING, "bar"),
      new T(token.RBRACE, "}"),
      new T(token.EOF, ""),
    ];

    let l = new lexer.Lexer(input);

    tests.forEach((tt, i) => {
      let tok = l.nextToken();

      expect(tok.type).equal(
        tt.expectedType,
        `test[${i}] - tokenType wrong. expected="${tt.expectedType}", got="${tok.type}"`
      );

      expect(tok.literal).equal(
        tt.expectedLiteral,
        `test[${i}] - literal wrong. expected="${tt.expectedLiteral}", got="${tok.literal}"`
      );
    });
  });
});
