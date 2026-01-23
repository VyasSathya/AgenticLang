/**
 * Z3 SMT Solver Integration for Formal Verification
 * Verifies contracts (@requires, @ensures) using Z3
 */

import { init } from 'z3-solver';
import * as AST from '../types';

export interface VerificationResult {
  verified: boolean;
  counterexample?: any;
  properties: Array<{
    name: string;
    proven: boolean;
    time_ms: number;
  }>;
}

export interface Contract {
  requires?: string[]; // Preconditions
  ensures?: string[];  // Postconditions
  invariants?: string[]; // Loop/object invariants
}

export class Z3VerificationEngine {
  private z3Context: any;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const { Context } = await init();
    this.z3Context = Context('main');
    this.initialized = true;
  }

  /**
   * Verify a function's contract using Z3
   */
  async verifyFunction(
    func: AST.FunctionDeclaration,
    contract: Contract
  ): Promise<VerificationResult> {
    await this.initialize();

    const solver = new this.z3Context.Solver();
    const properties: VerificationResult['properties'] = [];

    // Create Z3 variables from function parameters
    const vars: Record<string, any> = {};
    for (const param of func.params) {
      const type = param.typeAnnotation?.value;
      if (type === 'number') {
        vars[param.name] = this.z3Context.Real.const(param.name);
      } else if (type === 'boolean') {
        vars[param.name] = this.z3Context.Bool.const(param.name);
      }
      // Add more types as needed
    }

    // Verify each postcondition
    if (contract.ensures) {
      for (const postcondition of contract.ensures) {
        const startTime = Date.now();

        try {
          const result = await this.verifyProperty(
            solver,
            vars,
            contract.requires || [],
            postcondition
          );

          properties.push({
            name: postcondition,
            proven: result,
            time_ms: Date.now() - startTime,
          });
        } catch (error) {
          properties.push({
            name: postcondition,
            proven: false,
            time_ms: Date.now() - startTime,
          });
        }
      }
    }

    const allVerified = properties.every(p => p.proven);

    return {
      verified: allVerified,
      properties,
    };
  }

  /**
   * Verify that preconditions imply postconditions
   * ∀x. precondition(x) → postcondition(x)
   */
  private async verifyProperty(
    solver: any,
    vars: Record<string, any>,
    preconditions: string[],
    postcondition: string
  ): Promise<boolean> {
    // Build precondition formula
    const preFormulas = preconditions.map(pre =>
      this.parseExpression(pre, vars)
    );

    const preCombined = preFormulas.length > 0
      ? this.z3Context.And(...preFormulas)
      : this.z3Context.Bool.val(true);

    // Build postcondition formula
    const postFormula = this.parseExpression(postcondition, vars);

    // Check if ¬(precondition ∧ ¬postcondition) is UNSAT
    // This proves: precondition → postcondition
    solver.add(preCombined);
    solver.add(this.z3Context.Not(postFormula));

    const result = await solver.check();

    return result === 'unsat'; // UNSAT means the property is proven
  }

  /**
   * Parse expression string into Z3 formula
   * Simple parser for basic arithmetic and boolean expressions
   */
  private parseExpression(expr: string, vars: Record<string, any>): any {
    // This is a simplified parser - in production, use a proper expression parser

    // Handle comparison operators
    if (expr.includes('>')) {
      const [left, right] = expr.split('>').map(s => s.trim());
      return this.z3Context.GT(
        this.parseOperand(left, vars),
        this.parseOperand(right, vars)
      );
    }

    if (expr.includes('>=')) {
      const [left, right] = expr.split('>=').map(s => s.trim());
      return this.z3Context.GE(
        this.parseOperand(left, vars),
        this.parseOperand(right, vars)
      );
    }

    if (expr.includes('<')) {
      const [left, right] = expr.split('<').map(s => s.trim());
      return this.z3Context.LT(
        this.parseOperand(left, vars),
        this.parseOperand(right, vars)
      );
    }

    if (expr.includes('==')) {
      const [left, right] = expr.split('==').map(s => s.trim());
      return this.z3Context.Eq(
        this.parseOperand(left, vars),
        this.parseOperand(right, vars)
      );
    }

    if (expr.includes('!=')) {
      const [left, right] = expr.split('!=').map(s => s.trim());
      return this.z3Context.Not(
        this.z3Context.Eq(
          this.parseOperand(left, vars),
          this.parseOperand(right, vars)
        )
      );
    }

    // Handle boolean operators
    if (expr.includes('&&')) {
      const parts = expr.split('&&').map(s => s.trim());
      return this.z3Context.And(
        ...parts.map(p => this.parseExpression(p, vars))
      );
    }

    if (expr.includes('||')) {
      const parts = expr.split('||').map(s => s.trim());
      return this.z3Context.Or(
        ...parts.map(p => this.parseExpression(p, vars))
      );
    }

    // Default: try to parse as variable or constant
    return this.parseOperand(expr, vars);
  }

  private parseOperand(operand: string, vars: Record<string, any>): any {
    operand = operand.trim();

    // Check if it's a variable
    if (vars[operand]) {
      return vars[operand];
    }

    // Check if it's a number
    const num = parseFloat(operand);
    if (!isNaN(num)) {
      return this.z3Context.Real.val(num);
    }

    // Check if it's boolean
    if (operand === 'true') return this.z3Context.Bool.val(true);
    if (operand === 'false') return this.z3Context.Bool.val(false);

    throw new Error(`Cannot parse operand: ${operand}`);
  }

  /**
   * Check for common antipatterns
   */
  async checkAntipatterns(func: AST.FunctionDeclaration): Promise<string[]> {
    const issues: string[] = [];

    // Division by zero check
    if (func.body.toString().includes('/')) {
      issues.push('Potential division by zero - add precondition for divisor != 0');
    }

    // Array access without bounds check
    if (func.body.toString().match(/\[\d+\]/)) {
      issues.push('Array access without bounds check - verify index is valid');
    }

    return issues;
  }
}

/**
 * Statistical Confidence Validator
 * Validates confidence claims using Wilson score intervals
 */
export class ConfidenceValidator {
  private observations = new Map<string, boolean[]>();

  /**
   * Record function execution result
   */
  observe(functionName: string, success: boolean): void {
    if (!this.observations.has(functionName)) {
      this.observations.set(functionName, []);
    }
    this.observations.get(functionName)!.push(success);
  }

  /**
   * Calculate confidence interval using Wilson score
   */
  calculateConfidenceInterval(
    functionName: string,
    confidenceLevel: number = 0.95
  ): { lower: number; upper: number; samples: number } | null {
    const obs = this.observations.get(functionName);
    if (!obs || obs.length < 10) {
      return null; // Need at least 10 samples
    }

    const n = obs.length;
    const successes = obs.filter(x => x).length;
    const p = successes / n;

    // Z-score for confidence level (1.96 for 95%)
    const z = this.getZScore(confidenceLevel);

    // Wilson score interval
    const center = p + (z * z) / (2 * n);
    const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
    const denominator = 1 + (z * z) / n;

    return {
      lower: (center - margin) / denominator,
      upper: (center + margin) / denominator,
      samples: n,
    };
  }

  /**
   * Validate claimed confidence against observed data
   */
  validateClaim(
    functionName: string,
    claimedConfidence: number
  ): {
    valid: boolean;
    actual: { lower: number; upper: number } | null;
    recommendation: string;
  } {
    const actual = this.calculateConfidenceInterval(functionName);

    if (!actual) {
      return {
        valid: false,
        actual: null,
        recommendation: 'Need at least 10 runtime observations to validate confidence',
      };
    }

    const valid = claimedConfidence >= actual.lower && claimedConfidence <= actual.upper;

    let recommendation = '';
    if (!valid) {
      if (claimedConfidence > actual.upper) {
        recommendation = `Claimed confidence (${claimedConfidence}) is too high. Based on ${actual.samples} observations, confidence should be ${actual.upper.toFixed(2)} or lower.`;
      } else {
        recommendation = `Claimed confidence (${claimedConfidence}) is too low. Based on ${actual.samples} observations, you can increase it to ${actual.lower.toFixed(2)}.`;
      }
    }

    return { valid, actual, recommendation };
  }

  private getZScore(confidenceLevel: number): number {
    // Common z-scores
    const zScores: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576,
    };

    return zScores[confidenceLevel] || 1.96;
  }
}
