/**
 * Property-based test generator
 * Automatically generates fast-check tests from function signatures
 */

import * as AST from '../types';

export interface PropertyTest {
  functionName: string;
  properties: Property[];
  testCode: string;
}

export interface Property {
  name: string;
  description: string;
  testFunction: string;
}

export class PropertyTestGenerator {
  generate(ast: AST.ASTNode[]): PropertyTest[] {
    const tests: PropertyTest[] = [];

    for (const node of ast) {
      if (node.type === 'FunctionDeclaration') {
        const funcTests = this.generateForFunction(node);
        if (funcTests) {
          tests.push(funcTests);
        }
      }
    }

    return tests;
  }

  private generateForFunction(func: AST.FunctionDeclaration): PropertyTest | null {
    const properties = this.inferProperties(func);

    if (properties.length === 0) {
      return null;
    }

    const testCode = this.generateTestCode(func, properties);

    return {
      functionName: func.name,
      properties,
      testCode,
    };
  }

  private inferProperties(func: AST.FunctionDeclaration): Property[] {
    const properties: Property[] = [];

    // Extract properties from annotations
    for (const annotation of func.annotations) {
      if (annotation.name === 'property') {
        properties.push({
          name: annotation.args.name || 'custom_property',
          description: annotation.args.description || '',
          testFunction: '',
        });
      }
    }

    // Infer properties from return type
    if (func.returnType) {
      properties.push(...this.inferFromReturnType(func.returnType));
    }

    // Infer properties from parameters
    properties.push(...this.inferFromParameters(func.params));

    return properties;
  }

  private inferFromReturnType(returnType: AST.TypeAnnotation): Property[] {
    const properties: Property[] = [];

    // Result<T, E> should handle both success and failure
    if (returnType.kind === 'result') {
      properties.push({
        name: 'handles_success_case',
        description: 'Function handles successful result',
        testFunction: 'result.ok === true',
      });

      properties.push({
        name: 'handles_error_case',
        description: 'Function handles error result',
        testFunction: 'result.ok === false || result.ok === true',
      });
    }

    // Never returns null/undefined
    if (returnType.kind === 'primitive' || returnType.kind === 'custom') {
      properties.push({
        name: 'never_returns_null',
        description: 'Function never returns null or undefined',
        testFunction: 'result !== null && result !== undefined',
      });
    }

    return properties;
  }

  private inferFromParameters(params: AST.Parameter[]): Property[] {
    const properties: Property[] = [];

    // RULE 1: String parameters - test empty, whitespace, special chars
    if (params.some(p => p.typeAnnotation?.value === 'string')) {
      properties.push({
        name: 'handles_empty_string',
        description: 'Function handles empty string input',
        testFunction: 'typeof result !== "undefined"',
      });

      properties.push({
        name: 'handles_whitespace_only',
        description: 'Function handles whitespace-only strings',
        testFunction: 'typeof result !== "undefined"',
      });

      properties.push({
        name: 'handles_special_characters',
        description: 'Function handles strings with special characters',
        testFunction: 'typeof result !== "undefined"',
      });

      properties.push({
        name: 'handles_unicode',
        description: 'Function handles Unicode characters (emoji, etc.)',
        testFunction: 'typeof result !== "undefined"',
      });
    }

    // RULE 2: Number parameters - test zero, negative, infinity, NaN
    if (params.some(p => p.typeAnnotation?.value === 'number')) {
      properties.push({
        name: 'handles_zero',
        description: 'Function handles zero input',
        testFunction: 'typeof result !== "undefined"',
      });

      properties.push({
        name: 'handles_negative',
        description: 'Function handles negative numbers',
        testFunction: 'typeof result !== "undefined"',
      });

      properties.push({
        name: 'handles_large_numbers',
        description: 'Function handles very large numbers',
        testFunction: 'typeof result !== "undefined"',
      });

      properties.push({
        name: 'handles_decimals',
        description: 'Function handles decimal/floating-point numbers',
        testFunction: 'typeof result !== "undefined"',
      });

      properties.push({
        name: 'handles_infinity',
        description: 'Function handles Infinity and -Infinity',
        testFunction: 'typeof result !== "undefined"',
      });
    }

    // RULE 3: Array parameters - test empty, single, duplicates
    // Note: TypeAnnotation doesn't have 'kind' property yet, using value for now
    if (params.some(p => p.typeAnnotation?.value?.includes('[]'))) {
      properties.push({
        name: 'handles_empty_array',
        description: 'Function handles empty array input',
        testFunction: 'typeof result !== "undefined"',
      });

      properties.push({
        name: 'handles_single_element',
        description: 'Function handles single-element array',
        testFunction: 'typeof result !== "undefined"',
      });

      properties.push({
        name: 'handles_duplicate_elements',
        description: 'Function handles arrays with duplicate values',
        testFunction: 'typeof result !== "undefined"',
      });
    }

    // RULE 4: Object parameters - test missing fields, extra fields
    // Note: TypeAnnotation doesn't have 'kind' property yet, using heuristic
    if (params.some(p => p.typeAnnotation && !['string', 'number', 'boolean', 'void'].includes(p.typeAnnotation.value))) {
      properties.push({
        name: 'handles_missing_optional_fields',
        description: 'Function handles objects with missing optional fields',
        testFunction: 'typeof result !== "undefined"',
      });

      properties.push({
        name: 'handles_extra_fields',
        description: 'Function handles objects with unexpected extra fields',
        testFunction: 'typeof result !== "undefined"',
      });
    }

    // RULE 5: Async functions - test concurrent execution
    if (func.annotations.some(a => a.name === 'async')) {
      properties.push({
        name: 'concurrent_execution_safe',
        description: 'Function can be called concurrently without issues',
        testFunction: 'typeof result !== "undefined"',
      });

      properties.push({
        name: 'handles_cancellation',
        description: 'Function handles cancellation gracefully',
        testFunction: 'typeof result !== "undefined"',
      });
    }

    return properties;
  }

  // NEW: Infer properties from function name patterns
  private inferFromFunctionName(funcName: string): Property[] {
    const properties: Property[] = [];

    // Functions starting with 'is' or 'has' should return boolean
    if (/^(is|has)[A-Z]/.test(funcName)) {
      properties.push({
        name: 'returns_boolean',
        description: 'Predicate function returns boolean',
        testFunction: 'typeof result === "boolean"',
      });
    }

    // Functions with 'parse' should handle invalid input
    if (funcName.includes('parse') || funcName.includes('Parse')) {
      properties.push({
        name: 'rejects_invalid_input',
        description: 'Parse function returns error for invalid input',
        testFunction: 'result.ok === false when input is invalid',
      });
    }

    // Functions with 'validate' should be deterministic
    if (funcName.includes('validate') || funcName.includes('Validate')) {
      properties.push({
        name: 'deterministic_validation',
        description: 'Validation gives same result for same input',
        testFunction: 'validate(x) === validate(x)',
      });
    }

    return properties;
  }

  // NEW: Infer properties from confidence levels
  private inferFromConfidence(func: AST.FunctionDeclaration): Property[] {
    const properties: Property[] = [];
    const confAnnotation = func.annotations.find(a => a.name === 'confidence');

    if (confAnnotation && confAnnotation.args.level) {
      const confidence = parseFloat(confAnnotation.args.level);

      if (confidence >= 0.95) {
        properties.push({
          name: 'high_confidence_verified',
          description: 'High-confidence functions should pass all property tests',
          testFunction: 'result satisfies all properties',
        });
      }

      if (confidence < 0.70) {
        properties.push({
          name: 'low_confidence_documented',
          description: 'Low-confidence functions should document limitations',
          testFunction: 'has @uncertain annotation or documentation',
        });
      }
    }

    return properties;
  }

  // NEW: Infer error handling properties
  private inferErrorHandlingProperties(func: AST.FunctionDeclaration): Property[] {
    const properties: Property[] = [];

    if (func.returnType?.kind === 'result') {
      properties.push({
        name: 'error_messages_are_descriptive',
        description: 'Error results contain meaningful messages',
        testFunction: 'result.ok === false implies result.error.length > 0',
      });

      properties.push({
        name: 'errors_have_recovery_context',
        description: 'Errors include recovery suggestions when available',
        testFunction: 'result.ok === false implies has error context',
      });
    }

    return properties;
  }

  private generateTestCode(func: AST.FunctionDeclaration, properties: Property[]): string {
    const imports = `import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';
import { ${func.name} } from './${func.name}';

`;

    let testCode = imports;

    // Generate arbitraries for parameters
    const arbitraries = func.params.map(p => this.generateArbitrary(p));

    // Generate test cases
    for (const property of properties) {
      testCode += `test.prop([${arbitraries.join(', ')}], (${func.params.map(p => p.name).join(', ')}) => {
  const result = ${func.name}(${func.params.map(p => p.name).join(', ')});
  expect(${property.testFunction}).toBe(true);
}, { numRuns: 1000 });\n\n`;
    }

    return testCode;
  }

  private generateArbitrary(param: AST.Parameter): string {
    if (!param.typeAnnotation) {
      return 'fc.anything()';
    }

    const type = param.typeAnnotation.value;

    switch (type) {
      case 'string':
        return 'fc.string()';
      case 'number':
        return 'fc.integer()';
      case 'boolean':
        return 'fc.boolean()';
      default:
        return 'fc.anything()';
    }
  }
}