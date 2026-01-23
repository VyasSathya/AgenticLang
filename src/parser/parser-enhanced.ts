/**
 * Enhanced parser methods for match expressions and error recovery
 * These can be merged into parser.ts
 */

import { Token, TokenType, Lexer } from './lexer';
import * as AST from '../types';

// Add these methods to the Parser class

export function parseExpression_Enhanced(parser: any): AST.ASTNode {
  let expr = parser.parseBinaryExpression();

  // Check for match expression
  if (parser.check(TokenType.MATCH)) {
    return parseMatchExpression(parser, expr);
  }

  // Check for error recovery: expr or error { ... }
  if (parser.check(TokenType.OR)) {
    return parseErrorRecovery(parser, expr);
  }

  return expr;
}

export function parseMatchExpression(parser: any, discriminant: AST.ASTNode): AST.MatchExpression {
  parser.consume(TokenType.MATCH);
  parser.consume(TokenType.LBRACE);

  const cases: AST.MatchCase[] = [];

  while (!parser.check(TokenType.RBRACE) && !parser.isAtEnd()) {
    const pattern = parser.consume(TokenType.IDENTIFIER).value; // Ok, Err, _
    
    let binding: string | undefined;
    if (parser.match(TokenType.LPAREN)) {
      binding = parser.consume(TokenType.IDENTIFIER).value;
      parser.consume(TokenType.RPAREN);
    }

    parser.consume(TokenType.ARROW);

    // Parse body - can be expression or block
    let body: AST.ASTNode;
    if (parser.check(TokenType.LBRACE)) {
      body = parser.parseBlockStatement();
    } else {
      body = parser.parseExpression();
    }

    cases.push({ pattern, binding, body });

    // Optional comma between cases
    parser.match(TokenType.COMMA);
  }

  parser.consume(TokenType.RBRACE);

  return {
    type: 'MatchExpression',
    discriminant,
    cases,
  };
}

export function parseErrorRecovery(parser: any, expression: AST.ASTNode): AST.ErrorRecovery {
  parser.consume(TokenType.OR);
  parser.consume(TokenType.ERROR);
  parser.consume(TokenType.LBRACE);

  // Parse optional error binding
  let binding = 'e';
  
  // Parse @context annotation if present
  let contextBlock: AST.ContextBlock = {};
  if (parser.check(TokenType.AT)) {
    contextBlock = parseContextBlock(parser);
  }

  // Parse error action (usually a return statement or block)
  let errorAction: AST.ASTNode;
  if (parser.check(TokenType.RETURN)) {
    errorAction = parser.parseReturnStatement();
  } else {
    errorAction = parser.parseStatement() || { type: 'BlockStatement', body: [] };
  }

  parser.consume(TokenType.RBRACE);

  return {
    type: 'ErrorRecovery',
    binding,
    contextBlock,
    errorAction,
  };
}

export function parseContextBlock(parser: any): AST.ContextBlock {
  // Expect @context
  parser.consume(TokenType.AT);
  const contextToken = parser.consume(TokenType.IDENTIFIER);
  
  if (contextToken.value !== 'context') {
    throw new Error(`Expected @context, got @${contextToken.value}`);
  }

  parser.consume(TokenType.LBRACE);

  const context: AST.ContextBlock = {};

  // Parse key-value pairs
  while (!parser.check(TokenType.RBRACE) && !parser.isAtEnd()) {
    const keyToken = parser.consume(TokenType.IDENTIFIER);
    parser.consume(TokenType.COLON);

    // Parse value (simplified - just capture until comma or closing brace)
    const value = parseContextValue(parser);
    
    (context as any)[keyToken.value] = value;

    parser.match(TokenType.COMMA);
  }

  parser.consume(TokenType.RBRACE);

  return context;
}

export function parseContextValue(parser: any): any {
  // Simplified context value parsing
  if (parser.check(TokenType.STRING)) {
    return parser.advance().value;
  }
  if (parser.check(TokenType.NUMBER)) {
    return parseFloat(parser.advance().value);
  }
  if (parser.check(TokenType.BOOLEAN)) {
    return parser.advance().value === 'true';
  }
  if (parser.check(TokenType.LBRACE)) {
    // Parse object
    parser.consume(TokenType.LBRACE);
    const obj: any = {};
    while (!parser.check(TokenType.RBRACE) && !parser.isAtEnd()) {
      const key = parser.consume(TokenType.IDENTIFIER).value;
      parser.consume(TokenType.COLON);
      obj[key] = parseContextValue(parser);
      parser.match(TokenType.COMMA);
    }
    parser.consume(TokenType.RBRACE);
    return obj;
  }
  if (parser.check(TokenType.LBRACKET)) {
    // Parse array
    parser.consume(TokenType.LBRACKET);
    const arr: any[] = [];
    while (!parser.check(TokenType.RBRACKET) && !parser.isAtEnd()) {
      arr.push(parseContextValue(parser));
      parser.match(TokenType.COMMA);
    }
    parser.consume(TokenType.RBRACKET);
    return arr;
  }
  
  // Default: identifier or literal
  return parser.advance().value;
}

// Enhanced annotation parsing
export function parseAnnotation_Enhanced(parser: any): AST.Annotation {
  // Consume the @ token
  const atToken = parser.advance();

  // Extract annotation name
  let name = '';
  if (atToken.value.startsWith('@')) {
    const parts = atToken.value.match(/@(\w+)/);
    name = parts ? parts[1] : atToken.value.substring(1);
  } else {
    name = parser.consume(TokenType.IDENTIFIER).value;
  }

  const args: Record<string, any> = {};

  if (parser.match(TokenType.LPAREN)) {
    // Parse annotation arguments properly
    if (!parser.check(TokenType.RPAREN)) {
      // Try to parse as positional or named arguments
      // For @confidence(0.90) we expect a single number
      // For @needs(database: Database) we expect key: value pairs
      
      const firstToken = parser.peek();
      
      // Check if this looks like a named parameter (identifier followed by colon)
      const isNamed = firstToken.type === TokenType.IDENTIFIER && 
                      parser.peekNext()?.type === TokenType.COLON;
      
      if (isNamed) {
        // Parse named parameters
        do {
          const paramName = parser.consume(TokenType.IDENTIFIER).value;
          parser.consume(TokenType.COLON);
          const paramValue = parseAnnotationValue(parser);
          args[paramName] = paramValue;
        } while (parser.match(TokenType.COMMA));
      } else {
        // Parse positional parameter (single value)
        const value = parseAnnotationValue(parser);
        args['value'] = value;
      }
    }
    parser.consume(TokenType.RPAREN);
  }

  return {
    name,
    args,
  };
}

function parseAnnotationValue(parser: any): any {
  if (parser.check(TokenType.NUMBER)) {
    return parseFloat(parser.advance().value);
  }
  if (parser.check(TokenType.STRING)) {
    return parser.advance().value;
  }
  if (parser.check(TokenType.BOOLEAN)) {
    return parser.advance().value === 'true';
  }
  if (parser.check(TokenType.IDENTIFIER)) {
    // Could be a type reference
    return parser.advance().value;
  }
  throw new Error(`Unexpected token in annotation: ${parser.peek().type}`);
}
