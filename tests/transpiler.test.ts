/**
 * Transpiler integration tests
 */

import { describe, test, expect } from 'vitest';
import { transpile } from '../src/index';

describe('Transpiler', () => {
  test('transpiles simple function', async () => {
    const source = `
@confidence(0.95)
func add(a: number, b: number) -> number {
    return a + b
}
`;

    const result = await transpile(source);

    expect(result.code).toContain('function add');
    expect(result.code).toContain('a: number');
    expect(result.code).toContain('b: number');
    expect(result.code).toContain('return a + b');
  });

  test('includes runtime imports', async () => {
    const source = 'func test() { return true }';
    const result = await transpile(source);

    expect(result.code).toContain('import');
    expect(result.code).toContain('AgenticRuntime');
    expect(result.code).toContain('Result');
  });

  test('generates property tests when requested', async () => {
    const source = `
@property("never returns null")
func greet(name: string) -> string {
    return "Hello"
}
`;

    const result = await transpile(source, { propertyTests: true });

    expect(result.propertyTests).toBeDefined();
    expect(result.propertyTests).toContain('test.prop');
    expect(result.propertyTests).toContain('fc.string()');
  });

  test('preserves annotations as comments', async () => {
    const source = `
@confidence(0.90)
@needs(database: Database)
func test() {
    return true
}
`;

    const result = await transpile(source);

    expect(result.code).toContain('// @confidence');
    expect(result.code).toContain('// @needs');
  });

  test('generates source map when requested', async () => {
    const source = 'func test() { return true }';
    const result = await transpile(source, { sourceMap: true });

    expect(result.sourceMap).toBeDefined();
    const map = JSON.parse(result.sourceMap!);
    expect(map.version).toBe(3);
    expect(map.sources).toBeDefined();
  });
});
