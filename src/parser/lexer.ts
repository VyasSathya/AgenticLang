/**
 * Simple regex-based lexer for Agentic language
 * For MVP - full Tree-sitter parser can be added later
 */

export enum TokenType {
  // Keywords
  FUNC = 'FUNC',
  RETURN = 'RETURN',
  IF = 'IF',
  ELSE = 'ELSE',
  MATCH = 'MATCH',
  OR = 'OR',
  ERROR = 'ERROR',

  // Literals
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  NULL = 'NULL',

  // Identifiers
  IDENTIFIER = 'IDENTIFIER',

  // Operators
  ARROW = 'ARROW', // ->
  FAT_ARROW = 'FAT_ARROW', // =>
  PIPE = 'PIPE', // |
  DOT = 'DOT',
  COMMA = 'COMMA',
  COLON = 'COLON',
  SEMICOLON = 'SEMICOLON',
  PLUS = 'PLUS', // +
  MINUS = 'MINUS', // -
  STAR = 'STAR', // *
  SLASH = 'SLASH', // /
  PERCENT = 'PERCENT', // %

  // Comparison
  EQ = 'EQ', // ==
  NEQ = 'NEQ', // !=
  LT = 'LT',
  GT = 'GT',
  LTE = 'LTE',
  GTE = 'GTE',

  // Delimiters
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  LBRACKET = 'LBRACKET',
  RBRACKET = 'RBRACKET',

  // Annotations
  AT = 'AT', // @

  // Special
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
  UNKNOWN = 'UNKNOWN',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
  offset: number;
}

const KEYWORDS: Record<string, TokenType> = {
  func: TokenType.FUNC,
  return: TokenType.RETURN,
  if: TokenType.IF,
  else: TokenType.ELSE,
  match: TokenType.MATCH,
  or: TokenType.OR,
  error: TokenType.ERROR,
  true: TokenType.BOOLEAN,
  false: TokenType.BOOLEAN,
  null: TokenType.NULL,
};

export class Lexer {
  private source: string;
  private pos = 0;
  private line = 1;
  private column = 1;
  private tokens: Token[] = [];

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    this.tokens = [];

    while (this.pos < this.source.length) {
      this.skipWhitespace();

      if (this.pos >= this.source.length) break;

      // Skip comments
      if (this.peek() === '/' && this.peek(1) === '/') {
        this.skipLineComment();
        continue;
      }

      if (this.peek() === '/' && this.peek(1) === '*') {
        this.skipBlockComment();
        continue;
      }

      const token = this.nextToken();
      if (token.type !== TokenType.NEWLINE) {
        this.tokens.push(token);
      }
    }

    this.tokens.push(this.createToken(TokenType.EOF, ''));
    return this.tokens;
  }

  private nextToken(): Token {
    const char = this.peek();

    // Annotations
    if (char === '@') {
      return this.scanAnnotation();
    }

    // Strings
    if (char === '"' || char === "'") {
      return this.scanString();
    }

    // Numbers
    if (this.isDigit(char)) {
      return this.scanNumber();
    }

    // Identifiers and keywords
    if (this.isAlpha(char) || char === '_') {
      return this.scanIdentifier();
    }

    // Operators and delimiters
    return this.scanOperator();
  }

  private scanAnnotation(): Token {
    const start = this.pos;
    this.advance(); // consume @

    if (this.isAlpha(this.peek())) {
      while (this.isAlphaNumeric(this.peek())) {
        this.advance();
      }
    }

    const value = this.source.substring(start, this.pos);
    return this.createToken(TokenType.AT, value);
  }

  private scanString(): Token {
    const quote = this.peek();
    this.advance(); // consume opening quote

    const start = this.pos;
    while (this.peek() !== quote && !this.isAtEnd()) {
      if (this.peek() === '\\') {
        this.advance(); // skip escape
      }
      this.advance();
    }

    const value = this.source.substring(start, this.pos);
    this.advance(); // consume closing quote

    return this.createToken(TokenType.STRING, value);
  }

  private scanNumber(): Token {
    const start = this.pos;

    while (this.isDigit(this.peek())) {
      this.advance();
    }

    if (this.peek() === '.' && this.isDigit(this.peek(1))) {
      this.advance(); // consume .
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = this.source.substring(start, this.pos);
    return this.createToken(TokenType.NUMBER, value);
  }

  private scanIdentifier(): Token {
    const start = this.pos;

    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const value = this.source.substring(start, this.pos);
    const type = KEYWORDS[value] || TokenType.IDENTIFIER;

    return this.createToken(type, value);
  }

  private scanOperator(): Token {
    const char = this.peek();
    const next = this.peek(1);

    // Two-character operators
    if (char === '-' && next === '>') {
      this.advance();
      this.advance();
      return this.createToken(TokenType.ARROW, '->');
    }

    if (char === '=' && next === '>') {
      this.advance();
      this.advance();
      return this.createToken(TokenType.FAT_ARROW, '=>');
    }

    if (char === '=' && next === '=') {
      this.advance();
      this.advance();
      return this.createToken(TokenType.EQ, '==');
    }

    if (char === '!' && next === '=') {
      this.advance();
      this.advance();
      return this.createToken(TokenType.NEQ, '!=');
    }

    if (char === '<' && next === '=') {
      this.advance();
      this.advance();
      return this.createToken(TokenType.LTE, '<=');
    }

    if (char === '>' && next === '=') {
      this.advance();
      this.advance();
      return this.createToken(TokenType.GTE, '>=');
    }

    // Single-character operators
    const singleChars: Record<string, TokenType> = {
      '(': TokenType.LPAREN,
      ')': TokenType.RPAREN,
      '{': TokenType.LBRACE,
      '}': TokenType.RBRACE,
      '[': TokenType.LBRACKET,
      ']': TokenType.RBRACKET,
      ',': TokenType.COMMA,
      '.': TokenType.DOT,
      ':': TokenType.COLON,
      ';': TokenType.SEMICOLON,
      '|': TokenType.PIPE,
      '+': TokenType.PLUS,
      '-': TokenType.MINUS,
      '*': TokenType.STAR,
      '/': TokenType.SLASH,
      '%': TokenType.PERCENT,
      '<': TokenType.LT,
      '>': TokenType.GT,
      '\n': TokenType.NEWLINE,
    };

    const type = singleChars[char];
    if (type) {
      this.advance();
      return this.createToken(type, char);
    }

    // Unknown
    this.advance();
    return this.createToken(TokenType.UNKNOWN, char);
  }

  private skipWhitespace() {
    while (!this.isAtEnd() && /\s/.test(this.peek()) && this.peek() !== '\n') {
      this.advance();
    }
  }

  private skipLineComment() {
    while (this.peek() !== '\n' && !this.isAtEnd()) {
      this.advance();
    }
  }

  private skipBlockComment() {
    this.advance(); // /
    this.advance(); // *

    while (!this.isAtEnd()) {
      if (this.peek() === '*' && this.peek(1) === '/') {
        this.advance();
        this.advance();
        break;
      }
      this.advance();
    }
  }

  private peek(offset = 0): string {
    const index = this.pos + offset;
    return index < this.source.length ? this.source[index] : '\0';
  }

  private advance(): string {
    const char = this.source[this.pos++];
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  private isAtEnd(): boolean {
    return this.pos >= this.source.length;
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z_]/.test(char);
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private createToken(type: TokenType, value: string): Token {
    return {
      type,
      value,
      line: this.line,
      column: this.column - value.length,
      offset: this.pos - value.length,
    };
  }
}