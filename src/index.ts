/**
 * Agentic Language - Main Entry Point
 * Exports all public APIs
 */

export { Lexer, TokenType, type Token } from './parser/lexer';
export { Parser } from './parser/parser';
export { TypeScriptGenerator } from './generator/typescript-generator';
export { EnhancedPropertyTestGenerator as PropertyTestGenerator } from './property-tests/generator-enhanced';
export {
  AgenticRuntime,
  Result,
  Ok,
  Err,
  confidence,
  contextValidator,
  healthMonitor,
  type HealthCheck,
  type HealthStatus,
  type ConfidenceMetadata,
  type ContextRequirement,
} from './runtime';

export * from './types';

// Main transpile function
import { Parser as ParserClass } from './parser/parser';
import { TypeScriptGenerator as TSGenerator } from './generator/typescript-generator';
import { EnhancedPropertyTestGenerator as PropTestGen } from './property-tests/generator-enhanced';

export async function transpile(
  source: string,
  options: { sourceMap?: boolean; propertyTests?: boolean } = {}
): Promise<{
  code: string;
  sourceMap?: string;
  propertyTests?: string;
}> {
  const parser = new ParserClass();
  const ast = parser.parse(source);

  const generator = new TSGenerator('input.agentic');
  const code = generator.generate(ast);

  const result: { code: string; sourceMap?: string; propertyTests?: string } = { code };

  if (options.sourceMap) {
    result.sourceMap = generator.getSourceMap();
  }

  if (options.propertyTests) {
    const testGen = new PropTestGen();
    const tests = testGen.generate(ast);
    result.propertyTests = tests.map((t: any) => t.testCode).join('\n\n');
  }

  return result;
}
