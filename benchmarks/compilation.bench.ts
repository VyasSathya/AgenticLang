/**
 * Compilation Performance Benchmarks
 * Tracks performance regressions and improvements
 */

import { describe, bench } from 'vitest';
import { readFileSync } from 'fs';
import { Parser } from '../src/parser/parser';
import { TypeScriptGenerator } from '../src/generator/typescript-generator';

describe('Compilation Benchmarks', () => {
  const simpleCode = readFileSync('examples/simple.agentic', 'utf-8');
  const authCode = readFileSync('examples/auth.agentic', 'utf-8');
  const showcaseCode = readFileSync('examples/showcase.agentic', 'utf-8');

  bench('parse simple.agentic (10 lines)', () => {
    const parser = new Parser();
    parser.parse(simpleCode);
  });

  bench('parse auth.agentic (50 lines)', () => {
    const parser = new Parser();
    parser.parse(authCode);
  });

  bench('parse showcase.agentic (25 lines)', () => {
    const parser = new Parser();
    parser.parse(showcaseCode);
  });

  bench('full transpilation simple.agentic', () => {
    const parser = new Parser();
    const ast = parser.parse(simpleCode);
    const generator = new TypeScriptGenerator();
    generator.generate(ast);
  });

  bench('full transpilation auth.agentic', () => {
    const parser = new Parser();
    const ast = parser.parse(authCode);
    const generator = new TypeScriptGenerator();
    generator.generate(ast);
  });
});

describe('Runtime Benchmarks', () => {
  bench('Result type operations (1000 iterations)', () => {
    for (let i = 0; i < 1000; i++) {
      const result = { ok: true, value: 42 };
      const value = result.ok ? result.value : 0;
    }
  });

  bench('Confidence tracking registration (1000 calls)', () => {
    const tracker = new Map();
    for (let i = 0; i < 1000; i++) {
      tracker.set(`func_${i}`, {
        level: 0.95,
        reason: 'test',
        timestamp: Date.now(),
      });
    }
  });
});

// Performance targets (fail if exceeded)
describe('Performance Targets', () => {
  bench('compilation time < 200ms for 50-line file', () => {
    const parser = new Parser();
    const ast = parser.parse(authCode);
    const generator = new TypeScriptGenerator();
    const startTime = Date.now();
    generator.generate(ast);
    const elapsed = Date.now() - startTime;

    if (elapsed > 200) {
      throw new Error(`Compilation took ${elapsed}ms, target is <200ms`);
    }
  }, { time: 200 });
});
