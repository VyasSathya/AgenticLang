/**
 * Recursive descent parser for Agentic language
 * Converts tokens into AST
 */

import { Token, TokenType, Lexer } from './lexer';
import * as AST from '../types';

export class Parser {
  private tokens: Token[] = [];
  private current = 0;

  parse(source: string): AST.ASTNode[] {
    const lexer = new Lexer(source);
    this.tokens = lexer.tokenize();
    this.current = 0;

    const statements: AST.ASTNode[] = [];

    while (!this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
    }

    return statements;
  }

  private parseStatement(): AST.ASTNode | null {
    // Collect annotations (they're metadata for next statement)
    const annotations: AST.Annotation[] = [];
    while (this.check(TokenType.AT)) {
      annotations.push(this.parseAnnotation());
    }

    if (this.check(TokenType.FUNC)) {
      const func = this.parseFunctionDeclaration();
      func.annotations = annotations;
      return func;
    }

    if (this.check(TokenType.RETURN)) {
      return this.parseReturnStatement();
    }

    if (this.check(TokenType.IF)) {
      return this.parseIfStatement();
    }

    // Variable declaration or assignment
    if (this.check(TokenType.IDENTIFIER)) {
      return this.parseVariableOrExpression();
    }

    return null;
  }

  private parseFunctionDeclaration(): AST.FunctionDeclaration {
    this.consume(TokenType.FUNC);

    const nameToken = this.consume(TokenType.IDENTIFIER);
    const name = nameToken.value;

    this.consume(TokenType.LPAREN);
    const params = this.parseParameterList();
    this.consume(TokenType.RPAREN);

    let returnType: AST.TypeAnnotation | null = null;
    if (this.match(TokenType.ARROW)) {
      returnType = this.parseTypeAnnotation();
    }

    const body = this.parseBlockStatement();

    return {
      type: 'FunctionDeclaration',
      name,
      params,
      returnType,
      body,
      annotations: [],
    };
  }

  private parseParameterList(): AST.Parameter[] {
    const params: AST.Parameter[] = [];

    if (this.check(TokenType.RPAREN)) {
      return params;
    }

    do {
      const nameToken = this.consume(TokenType.IDENTIFIER);
      let typeAnnotation: AST.TypeAnnotation | null = null;

      if (this.match(TokenType.COLON)) {
        typeAnnotation = this.parseTypeAnnotation();
      }

      params.push({
        name: nameToken.value,
        typeAnnotation,
      });
    } while (this.match(TokenType.COMMA));

    return params;
  }

  private parseTypeAnnotation(): AST.TypeAnnotation {
    // Simple type parsing: string | number | Result<T, E> | custom
    const token = this.consume(TokenType.IDENTIFIER);

    // Check for Result<T, E>
    if (token.value === 'Result' && this.match(TokenType.LT)) {
      const okType = this.parseTypeAnnotation();
      this.consume(TokenType.COMMA);
      const errType = this.parseTypeAnnotation();
      this.consume(TokenType.GT);

      return {
        kind: 'result',
        value: [okType, errType],
      };
    }

    // Check for union types: Type1 | Type2
    if (this.check(TokenType.PIPE)) {
      const types: AST.TypeAnnotation[] = [{ kind: 'custom', value: token.value }];

      while (this.match(TokenType.PIPE)) {
        const nextToken = this.consume(TokenType.IDENTIFIER);
        types.push({ kind: 'custom', value: nextToken.value });
      }

      return {
        kind: 'union',
        value: types,
      };
    }

    // Primitive or custom type
    const primitives = ['string', 'number', 'boolean', 'void'];
    const kind = primitives.includes(token.value) ? 'primitive' : 'custom';

    return {
      kind,
      value: token.value,
    };
  }

  private parseBlockStatement(): AST.BlockStatement {
    this.consume(TokenType.LBRACE);

    const body: AST.ASTNode[] = [];

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) {
        body.push(stmt);
      }
    }

    this.consume(TokenType.RBRACE);

    return {
      type: 'BlockStatement',
      body,
    };
  }

  private parseReturnStatement(): AST.ReturnStatement {
    this.consume(TokenType.RETURN);

    let argument: AST.ASTNode | null = null;

    if (!this.check(TokenType.SEMICOLON) && !this.check(TokenType.RBRACE)) {
      argument = this.parseExpression();
    }

    return {
      type: 'ReturnStatement',
      argument,
    };
  }

  private parseIfStatement(): AST.IfStatement {
    this.consume(TokenType.IF);

    const condition = this.parseExpression();
    const consequent = this.parseBlockStatement();

    let alternate: AST.BlockStatement | AST.IfStatement | null = null;

    if (this.match(TokenType.ELSE)) {
      if (this.check(TokenType.IF)) {
        alternate = this.parseIfStatement();
      } else {
        alternate = this.parseBlockStatement();
      }
    }

    return {
      type: 'IfStatement',
      condition,
      consequent,
      alternate,
    };
  }

  private parseVariableOrExpression(): AST.ASTNode {
    const nameToken = this.peek();

    // Look ahead for assignment
    if (this.peekNext()?.type === TokenType.EQ || this.peekNext()?.value === '=') {
      this.advance(); // consume identifier
      this.advance(); // consume =

      const initializer = this.parseExpression();

      return {
        type: 'VariableDeclaration',
        name: nameToken.value,
        initializer,
        typeAnnotation: null,
      };
    }

    return this.parseExpression();
  }

  private parseExpression(): AST.ASTNode {
    return this.parseBinaryExpression();
  }

  private parseBinaryExpression(): AST.ASTNode {
    let left = this.parsePrimaryExpression();

    // Check for match expression
    if (this.check(TokenType.MATCH)) {
      this.advance(); // consume 'match'
      return this.parseMatchExpression(left);
    }

    // Check for error recovery (or error {...})
    if (this.check(TokenType.OR)) {
      const nextToken = this.peekNext();
      if (nextToken && nextToken.value === 'error') {
        this.advance(); // consume 'or'
        this.advance(); // consume 'error'
        return this.parseErrorRecovery(left);
      }
    }

    const operators = [
      TokenType.EQ, TokenType.NEQ, TokenType.LT, TokenType.GT, TokenType.LTE, TokenType.GTE,
      TokenType.PLUS, TokenType.MINUS, TokenType.STAR, TokenType.SLASH, TokenType.PERCENT
    ];

    while (operators.some(op => this.check(op))) {
      const operator = this.advance().value;
      const right = this.parsePrimaryExpression();

      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right,
      };
    }

    return left;
  }

  private parsePrimaryExpression(): AST.ASTNode {
    // Literals
    if (this.check(TokenType.NUMBER)) {
      const token = this.advance();
      return {
        type: 'Literal',
        value: parseFloat(token.value),
        raw: token.value,
      };
    }

    if (this.check(TokenType.STRING)) {
      const token = this.advance();
      return {
        type: 'Literal',
        value: token.value,
        raw: `"${token.value}"`,
      };
    }

    if (this.check(TokenType.BOOLEAN)) {
      const token = this.advance();
      return {
        type: 'Literal',
        value: token.value === 'true',
        raw: token.value,
      };
    }

    if (this.check(TokenType.NULL)) {
      const token = this.advance();
      return {
        type: 'Literal',
        value: null,
        raw: 'null',
      };
    }

    // Function calls
    if (this.check(TokenType.IDENTIFIER)) {
      const nameToken = this.advance();

      if (this.match(TokenType.LPAREN)) {
        const args: AST.ASTNode[] = [];

        if (!this.check(TokenType.RPAREN)) {
          do {
            args.push(this.parseExpression());
          } while (this.match(TokenType.COMMA));
        }

        this.consume(TokenType.RPAREN);

        return {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: nameToken.value },
          arguments: args,
        };
      }

      // Method calls (dot notation)
      if (this.match(TokenType.DOT)) {
        const methodToken = this.consume(TokenType.IDENTIFIER);
        this.consume(TokenType.LPAREN);

        const args: AST.ASTNode[] = [];
        if (!this.check(TokenType.RPAREN)) {
          do {
            args.push(this.parseExpression());
          } while (this.match(TokenType.COMMA));
        }

        this.consume(TokenType.RPAREN);

        return {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: `${nameToken.value}.${methodToken.value}`,
          },
          arguments: args,
        };
      }

      return {
        type: 'Identifier',
        name: nameToken.value,
      };
    }

    throw new Error(`Unexpected token: ${this.peek().type}`);
  }

  private parseAnnotation(): AST.Annotation {
    // Consume the @ token
    const atToken = this.advance();

    // The annotation name should be in the AT token's value after @
    // But our lexer includes the @ in the value, so we need to parse it differently
    let name = '';

    if (atToken.value.startsWith('@')) {
      name = atToken.value.substring(1);
    } else {
      name = this.consume(TokenType.IDENTIFIER).value;
    }

    const args: Record<string, any> = {};

    if (this.match(TokenType.LPAREN)) {
      // Parse annotation arguments
      if (!this.check(TokenType.RPAREN)) {
        let argIndex = 0;

        // Handle both named and positional arguments
        while (!this.check(TokenType.RPAREN) && !this.isAtEnd()) {
          // Check if it's a named argument (identifier followed by ':' or '=')
          if (this.check(TokenType.IDENTIFIER)) {
            const nextToken = this.peekNext();
            if (nextToken && (nextToken.value === ':' || nextToken.value === '=')) {
              // Named argument
              const key = this.advance().value;
              this.advance(); // consume ':' or '='
              const value = this.parseAnnotationValue();
              args[key] = value;
            } else {
              // Positional argument
              const value = this.parseAnnotationValue();
              args[`arg${argIndex}`] = value;
              argIndex++;
            }
          } else {
            // Positional argument (literal value)
            const value = this.parseAnnotationValue();
            args[`arg${argIndex}`] = value;
            argIndex++;
          }

          // Check for comma separator
          if (!this.check(TokenType.RPAREN)) {
            this.match(TokenType.COMMA);
          }
        }
      }
      this.consume(TokenType.RPAREN);
    }

    return {
      name,
      args,
    };
  }

  private parseAnnotationValue(): any {
    // Parse a single annotation argument value
    if (this.check(TokenType.NUMBER)) {
      return parseFloat(this.advance().value);
    }

    if (this.check(TokenType.STRING)) {
      return this.advance().value;
    }

    if (this.check(TokenType.BOOLEAN)) {
      return this.advance().value === 'true';
    }

    if (this.check(TokenType.NULL)) {
      this.advance();
      return null;
    }

    if (this.check(TokenType.IDENTIFIER)) {
      // Could be an enum value or reference
      return this.advance().value;
    }

    // Default: consume and return as string
    return this.advance().value;
  }

  // Utility methods
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private peekNext(): Token | null {
    if (this.current + 1 >= this.tokens.length) return null;
    return this.tokens[this.current + 1];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType): Token {
    if (this.check(type)) return this.advance();

    throw new Error(
      `Expected ${type} but got ${this.peek().type} at line ${this.peek().line}`
    );
  }

  private parseMatchExpression(discriminant: AST.ASTNode): AST.MatchExpression {
    // Parse: result match { Ok(x) -> expr, Err(e) -> expr }
    this.consume(TokenType.LBRACE);

    const cases: AST.MatchCase[] = [];

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      // Parse pattern: Ok(x), Err(e), or _
      const patternToken = this.consume(TokenType.IDENTIFIER);
      const pattern = patternToken.value;

      let binding: string | undefined;

      // Check for binding: Ok(x)
      if (this.match(TokenType.LPAREN)) {
        const bindingToken = this.consume(TokenType.IDENTIFIER);
        binding = bindingToken.value;
        this.consume(TokenType.RPAREN);
      }

      // Consume ->
      this.advance(); // consume '-'
      if (this.peek().value === '>') {
        this.advance();
      }

      // Parse body (single expression or block)
      let body: AST.ASTNode;
      if (this.check(TokenType.LBRACE)) {
        body = this.parseBlockStatement();
      } else {
        body = this.parseExpression();
      }

      cases.push({
        pattern,
        binding,
        body,
      });

      // Check for comma
      if (!this.check(TokenType.RBRACE)) {
        this.match(TokenType.COMMA);
      }
    }

    this.consume(TokenType.RBRACE);

    return {
      type: 'MatchExpression',
      discriminant,
      cases,
    };
  }

  private parseErrorRecovery(expression: AST.ASTNode): AST.ErrorRecovery {
    // Parse: call() or error { @context {...} return Err(...) }
    this.consume(TokenType.LBRACE);

    let contextBlock: AST.ContextBlock = {};

    // Look for @context annotation
    while (this.check(TokenType.AT) && !this.isAtEnd()) {
      const annotation = this.parseAnnotation();

      if (annotation.name === 'context') {
        // Parse context block
        if (this.match(TokenType.LBRACE)) {
          // Parse key-value pairs
          while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
            if (this.check(TokenType.IDENTIFIER)) {
              const key = this.advance().value;

              // Skip colon if present
              if (this.peek().value === ':') {
                this.advance();
              }

              // Skip until comma or closing brace
              while (!this.check(TokenType.COMMA) && !this.check(TokenType.RBRACE) && !this.isAtEnd()) {
                this.advance();
              }

              if (this.match(TokenType.COMMA)) {
                continue;
              }
            }
          }
          this.consume(TokenType.RBRACE);
        }
      }
    }

    // Parse error action (typically a return statement)
    const errorAction = this.parseStatement();

    this.consume(TokenType.RBRACE);

    // Provide a default error action if none was parsed
    const finalErrorAction: AST.ASTNode = errorAction || {
      type: 'ReturnStatement',
      argument: null,
    };

    return {
      type: 'ErrorRecovery',
      binding: 'error',
      contextBlock,
      errorAction: finalErrorAction,
    };
  }
}