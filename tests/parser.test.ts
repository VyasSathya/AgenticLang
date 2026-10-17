/**
 * Parser tests
 */

import { describe, test, expect } from 'vitest';
import { Parser } from '../src/parser/parser';
import { Lexer, TokenType } from '../src/parser/lexer';

describe('Lexer', () => {
  test('tokenizes basic function', () => {
    const source = 'func add(a: number, b: number) -> number';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.FUNC);
    expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[1].value).toBe('add');
    expect(tokens[2].type).toBe(TokenType.LPAREN);
  });

  test('tokenizes annotations', () => {
    const source = '@confidence(0.90)';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.AT);
    expect(tokens[0].value).toContain('@confidence');
  });

  test('tokenizes strings', () => {
    const source = '"hello world"';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.STRING);
    expect(tokens[0].value).toBe('hello world');
  });

  test('tokenizes numbers', () => {
    const source = '123.45';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.NUMBER);
    expect(tokens[0].value).toBe('123.45');
  });

  test('skips comments', () => {
    const source = '// comment\nfunc test()';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    // Should not include comment tokens
    expect(tokens[0].type).toBe(TokenType.FUNC);
  });
});

describe('Parser', () => {
  test('parses simple function', () => {
    const source = 'func add(a: number, b: number) -> number { return a + b }';
    const parser = new Parser();
    const ast = parser.parse(source);

    expect(ast).toBeDefined();
    expect(ast.length).toBeGreaterThan(0);
    expect(ast[0].type).toBe('FunctionDeclaration');
  });

  test('parses function with annotations', () => {
    const source = '@confidence(0.90)\nfunc test() { return true }';
    const parser = new Parser();
    const ast = parser.parse(source);

    expect(ast).toBeDefined();
    expect(ast[0].type).toBe('FunctionDeclaration');
  });

  test('parses if statement', () => {
    const source = 'func test(x: number) { if x == 0 { return true } }';
    const parser = new Parser();
    const ast = parser.parse(source);

    expect(ast).toBeDefined();
    const func = ast[0] as any;
    expect(func.body.body[0].type).toBe('IfStatement');
  });

  test('parses variable declaration', () => {
    const source = 'func test() { x = 10 }';
    const parser = new Parser();
    const ast = parser.parse(source);

    expect(ast).toBeDefined();
    const func = ast[0] as any;
    expect(func.body.body[0].type).toBe('VariableDeclaration');
  });

  test('parses return statement', () => {
    const source = 'func test() { return 42 }';
    const parser = new Parser();
    const ast = parser.parse(source);

    expect(ast).toBeDefined();
    const func = ast[0] as any;
    expect(func.body.body[0].type).toBe('ReturnStatement');
  });

  test('parses match expression', () => {
    const source = 'func test(x: Result<number, string>) { x match { Ok(v) -> v, Err(e) -> 0 } }';
    const parser = new Parser();
    const ast = parser.parse(source);

    expect(ast).toBeDefined();
    const func = ast[0] as any;
    // The match is an expression statement in the body
    expect(func.body.body[0].type).toBe('MatchExpression');
    expect(func.body.body[0].cases).toBeDefined();
    expect(func.body.body[0].cases.length).toBeGreaterThanOrEqual(2);
  });

  test('parses annotations with arguments', () => {
    const source = '@confidence(0.90, "high confidence")\nfunc test() { return true }';
    const parser = new Parser();
    const ast = parser.parse(source);

    expect(ast).toBeDefined();
    const func = ast[0] as any;
    expect(func.annotations.length).toBeGreaterThan(0);
    expect(func.annotations[0].name).toBe('confidence');
    expect(func.annotations[0].args).toBeDefined();
    expect(func.annotations[0].args.arg0).toBe(0.90);
  });

  test('parses @stub annotation', () => {
    const source = '@stub\nfunc notImplemented() { }';
    const parser = new Parser();
    const ast = parser.parse(source);

    expect(ast).toBeDefined();
    const func = ast[0] as any;
    const stubAnnotation = func.annotations.find((a: any) => a.name === 'stub');
    expect(stubAnnotation).toBeDefined();
  });

  test('parses @needs annotation', () => {
    const source = '@needs(database, api_key)\nfunc query() { }';
    const parser = new Parser();
    const ast = parser.parse(source);

    expect(ast).toBeDefined();
    const func = ast[0] as any;
    const needsAnnotation = func.annotations.find((a: any) => a.name === 'needs');
    expect(needsAnnotation).toBeDefined();
    expect(needsAnnotation.args).toBeDefined();
  });

  test('parses nested match expressions', () => {
    const source = 'func test(x: Result<number, string>) { x match { Ok(v) -> { v match { Ok(n) -> n, Err(e) -> 0 } }, Err(e) -> 0 } }';
    const parser = new Parser();
    const ast = parser.parse(source);

    expect(ast).toBeDefined();
    const func = ast[0] as any;
    expect(func.body.body[0].type).toBe('MatchExpression');
  });
});

describe('TypeScript Code Generation', () => {
  test('generates code with runtime imports', () => {
    const { TypeScriptGenerator } = require('../src/generator/typescript-generator');
    const source = 'func test() { return 42 }';
    const parser = new Parser();
    const ast = parser.parse(source);

    const generator = new TypeScriptGenerator('test.agentic');
    const code = generator.generate(ast);

    expect(code).toContain('import { AgenticRuntime, Result, Ok, Err }');
    expect(code).toContain('function test()');
    expect(code).toContain('return 42');
  });

  test('generates confidence tracking calls', () => {
    const { TypeScriptGenerator } = require('../src/generator/typescript-generator');
    const source = '@confidence(0.90, "tested")\nfunc test() { return 42 }';
    const parser = new Parser();
    const ast = parser.parse(source);

    const generator = new TypeScriptGenerator('test.agentic');
    const code = generator.generate(ast);

    expect(code).toContain('AgenticRuntime.confidence.register');
    expect(code).toContain('0.90');
  });

  test('generates stub function with error throw', () => {
    const { TypeScriptGenerator } = require('../src/generator/typescript-generator');
    const source = '@stub\nfunc notImplemented() { }';
    const parser = new Parser();
    const ast = parser.parse(source);

    const generator = new TypeScriptGenerator('test.agentic');
    const code = generator.generate(ast);

    expect(code).toContain('throw new Error');
    expect(code).toContain('stub');
  });
});

describe('Runtime Library', () => {
  test('Result type works correctly', () => {
    const { Ok, Err, isOk, isErr, unwrap } = require('../src/runtime/index');

    const okResult = Ok(42);
    expect(isOk(okResult)).toBe(true);
    expect(isErr(okResult)).toBe(false);
    expect(unwrap(okResult)).toBe(42);

    const errResult = Err('error');
    expect(isOk(errResult)).toBe(false);
    expect(isErr(errResult)).toBe(true);
    expect(() => unwrap(errResult)).toThrow();
  });

  test('map and andThen work correctly', () => {
    const { Ok, map, andThen } = require('../src/runtime/index');

    const result = Ok(10);
    const mapped = map(result, (x: number) => x * 2);
    expect(mapped.ok && mapped.value).toBe(20);

    const chained = andThen(result, (x: number) => Ok(x + 5));
    expect(chained.ok && chained.value).toBe(15);
  });

  test('unwrapOr provides default value', () => {
    const { Ok, Err, unwrapOr } = require('../src/runtime/index');

    const okResult = Ok(42);
    expect(unwrapOr(okResult, 0)).toBe(42);

    const errResult = Err('error');
    expect(unwrapOr(errResult, 0)).toBe(0);
  });
});
