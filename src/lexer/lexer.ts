import * as token from "../token/token";

function newToken(tokenType: token.TokenType, ch: string): token.Token {
  return { type: tokenType, literal: ch };
}

export class Lexer {
  protected position: number = 0;
  protected readPosition: number = 0;
  protected ch: string;

  constructor(protected input: string) {
    this.readChar();
  }

  nextToken(): token.Token {
    let tok = { type: "", literal: "" };

    this.skipWhitespace();

    switch (this.ch) {
      case "=":
        if (this.peekChar() === "=") {
          let ch = this.ch;
          this.readChar();
          tok = newToken(token.EQ, ch + this.ch);
        } else {
          tok = newToken(token.ASSIGN, this.ch);
        }
        break;
      case "+":
        tok = newToken(token.PLUS, this.ch);
        break;
      case "-":
        tok = newToken(token.MINUS, this.ch);
        break;
      case "!":
        if (this.peekChar() === "=") {
          let ch = this.ch;
          this.readChar();
          tok = newToken(token.NOT_EQ, ch + this.ch);
        } else {
          tok = newToken(token.BANG, this.ch);
        }
        break;
      case "/":
        tok = newToken(token.SLASH, this.ch);
        break;
      case "*":
        tok = newToken(token.ASTERISK, this.ch);
        break;
      case "<":
        tok = newToken(token.LT, this.ch);
        break;
      case ">":
        tok = newToken(token.GT, this.ch);
        break;
      case ";":
        tok = newToken(token.SEMICOLON, this.ch);
        break;
      case ",":
        tok = newToken(token.COMMA, this.ch);
        break;
      case "(":
        tok = newToken(token.LPAREN, this.ch);
        break;
      case ")":
        tok = newToken(token.RPAREN, this.ch);
        break;
      case "{":
        tok = newToken(token.LBRACE, this.ch);
        break;
      case "}":
        tok = newToken(token.RBRACE, this.ch);
        break;
      case "[":
        tok = newToken(token.LBRACKET, this.ch);
        break;
      case "]":
        tok = newToken(token.RBRACKET, this.ch);
        break;
      case ":":
        tok = newToken(token.COLON, this.ch);
        break;
      case `"`:
        tok.type = token.STRING;
        tok.literal = this.readString();
        break;
      case "":
        tok.literal = "";
        tok.type = token.EOF;
        break;
      default:
        if (this.isLetter(this.ch)) {
          tok.literal = this.readIdentifier();
          tok.type = token.lookupIdent(tok.literal);
          return tok;
        } else if (this.isDigit(this.ch)) {
          tok.type = token.INT;
          tok.literal = this.readNumber();
          return tok;
        } else {
          tok = newToken(token.ILLEGAL, this.ch);
        }
        break;
    }

    this.readChar();
    return tok;
  }

  protected isDigit(ch: string): boolean {
    if (ch.length === 1) {
      let n = ch.charCodeAt(0);
      return n >= 48 && n <= 57;
    }
    return false;
  }

  protected isLetter(ch: string): boolean {
    if (ch.length === 1) {
      let n = ch.charCodeAt(0);
      return (n >= 65 && n <= 90) || (n >= 97 && n <= 122);
    }
    return false;
  }

  protected skipWhitespace() {
    while (this.ch === " " || this.ch === "\t" || this.ch === "\n" || this.ch === "\r") {
      this.readChar();
    }
  }

  protected readIdentifier(): string {
    let position = this.position;
    while (this.isLetter(this.ch)) {
      this.readChar();
    }
    return this.input.substring(position, this.position);
  }

  protected readNumber(): string {
    let position = this.position;
    while (this.isDigit(this.ch)) {
      this.readChar();
    }
    return this.input.substring(position, this.position);
  }

  protected readString(): string {
    let position = this.position + 1;
    while (true) {
      this.readChar();
      if (this.ch === `"`) {
        break;
      }
    }
    return this.input.substring(position, this.position);
  }

  protected readChar(): void {
    if (this.readPosition >= this.input.length) {
      this.ch = "";
    } else {
      this.ch = this.input.charAt(this.readPosition);
    }
    this.position = this.readPosition;
    this.readPosition += 1;
  }

  protected peekChar(): string {
    if (this.readPosition >= this.input.length) {
      return "";
    } else {
      return this.input.charAt(this.readPosition);
    }
  }
}
