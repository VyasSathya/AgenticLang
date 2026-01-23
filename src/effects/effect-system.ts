/**
 * Effect System for Agentic
 * Tracks side effects at type level (inspired by Koka, Eff, Unison)
 */

import * as AST from '../types';

// Effect Types
export type Effect =
  | 'pure'           // No side effects
  | 'io'             // I/O operations (console, file)
  | 'state'          // Mutable state access
  | 'async'          // Asynchronous operations
  | 'network'        // Network calls (HTTP, WebSocket)
  | 'database'       // Database operations
  | 'llm_call'       // LLM API calls
  | 'human_interaction'  // Human approval/input
  | 'file_system'    // File system access
  | 'random'         // Non-deterministic (Math.random, etc.)
  | 'exception';     // Can throw exceptions

// Effect Set (combination of effects)
export interface EffectSet {
  effects: Set<Effect>;
}

// Function signature with effects
export interface FunctionSignatureWithEffects {
  name: string;
  params: AST.Parameter[];
  returnType: AST.TypeAnnotation | null;
  effects: EffectSet;
  annotations: AST.Annotation[];
}

// Effect Inference Engine
export class EffectInferenceEngine {
  private functionEffects = new Map<string, EffectSet>();

  /**
   * Infer effects from function body
   */
  inferEffects(func: AST.FunctionDeclaration): EffectSet {
    const effects = new Set<Effect>();

    // Check for explicit effect annotations
    const effectAnnotation = func.annotations.find(a => a.name === 'effects');
    if (effectAnnotation && effectAnnotation.args.effects) {
      const declaredEffects = effectAnnotation.args.effects as string[];
      declaredEffects.forEach(e => effects.add(e as Effect));
      return { effects };
    }

    // Infer from function body
    this.analyzeNode(func.body, effects);

    // Cache for future use
    this.functionEffects.set(func.name, { effects });

    return { effects };
  }

  private analyzeNode(node: AST.ASTNode, effects: Set<Effect>): void {
    switch (node.type) {
      case 'CallExpression':
        this.analyzeCallExpression(node as AST.CallExpression, effects);
        break;

      case 'BlockStatement':
        const block = node as AST.BlockStatement;
        block.body.forEach(stmt => this.analyzeNode(stmt, effects));
        break;

      case 'IfStatement':
        const ifStmt = node as AST.IfStatement;
        this.analyzeNode(ifStmt.consequent, effects);
        if (ifStmt.alternate) {
          this.analyzeNode(ifStmt.alternate, effects);
        }
        break;
    }
  }

  private analyzeCallExpression(call: AST.CallExpression, effects: Set<Effect>): void {
    const calleeName = (call.callee as AST.Identifier).name;

    // Known effectful functions
    const effectMap: Record<string, Effect> = {
      'console.log': 'io',
      'fetch': 'network',
      'database.query': 'database',
      'llm.complete': 'llm_call',
      'Math.random': 'random',
      'fs.readFile': 'file_system',
      'prompt': 'human_interaction',
    };

    // Check if this is a known effectful operation
    for (const [pattern, effect] of Object.entries(effectMap)) {
      if (calleeName.includes(pattern.split('.')[0])) {
        effects.add(effect);
      }
    }

    // Check for async operations (Promise, await)
    if (calleeName.includes('async') || calleeName.includes('await')) {
      effects.add('async');
    }

    // Look up callee's effects (if we've analyzed it)
    const calleeEffects = this.functionEffects.get(calleeName);
    if (calleeEffects) {
      calleeEffects.effects.forEach(e => effects.add(e));
    }
  }

  /**
   * Check if function effects are compatible with declared effects
   */
  validateEffects(
    func: AST.FunctionDeclaration,
    inferredEffects: EffectSet
  ): { valid: boolean; violations: string[] } {
    const effectAnnotation = func.annotations.find(a => a.name === 'effects');

    if (!effectAnnotation) {
      // No declared effects, all inferred effects are violations of purity
      if (inferredEffects.effects.size > 0) {
        return {
          valid: false,
          violations: Array.from(inferredEffects.effects).map(
            e => `Undeclared effect: ${e}`
          ),
        };
      }
      return { valid: true, violations: [] };
    }

    const declaredEffects = new Set(effectAnnotation.args.effects as Effect[]);
    const violations: string[] = [];

    // Check for undeclared effects
    for (const effect of inferredEffects.effects) {
      if (!declaredEffects.has(effect)) {
        violations.push(`Effect '${effect}' used but not declared`);
      }
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * Combine effects from multiple functions (for composition)
   */
  combineEffects(effects1: EffectSet, effects2: EffectSet): EffectSet {
    const combined = new Set<Effect>([
      ...effects1.effects,
      ...effects2.effects,
    ]);
    return { effects: combined };
  }

  /**
   * Check if function is pure (no effects)
   */
  isPure(effectSet: EffectSet): boolean {
    return effectSet.effects.size === 0 ||
           (effectSet.effects.size === 1 && effectSet.effects.has('pure'));
  }
}

// Effect Handler (for custom effect interpretation)
export interface EffectHandler<E extends Effect> {
  effect: E;
  handle: (operation: any) => any;
}

export class EffectHandlerRegistry {
  private handlers = new Map<Effect, EffectHandler<any>>();

  register<E extends Effect>(handler: EffectHandler<E>): void {
    this.handlers.set(handler.effect, handler);
  }

  get<E extends Effect>(effect: E): EffectHandler<E> | undefined {
    return this.handlers.get(effect);
  }

  /**
   * Execute function with custom effect handlers
   */
  async withHandlers<T>(
    fn: () => T,
    handlers: EffectHandler<any>[]
  ): Promise<T> {
    // Install handlers
    handlers.forEach(h => this.register(h));

    try {
      return await fn();
    } finally {
      // Cleanup handlers
      handlers.forEach(h => this.handlers.delete(h.effect));
    }
  }
}

// Predefined effect handlers
export const consoleHandler: EffectHandler<'io'> = {
  effect: 'io',
  handle: (operation) => {
    console.log('[IO]', operation);
  },
};

export const mockDatabaseHandler: EffectHandler<'database'> = {
  effect: 'database',
  handle: (operation) => {
    // Return mock data
    return { ok: true, value: { id: 1, name: 'Mock User' } };
  },
};

// Cost tracking for effectful operations
export class EffectCostTracker {
  private costs: Record<Effect, number> = {
    pure: 0,
    io: 0.0001,
    state: 0.0001,
    async: 0.0002,
    network: 0.001,
    database: 0.002,
    llm_call: 0.01,
    human_interaction: 0.05,
    file_system: 0.0005,
    random: 0.0001,
    exception: 0.0001,
  };

  estimateCost(effectSet: EffectSet): number {
    let totalCost = 0;
    for (const effect of effectSet.effects) {
      totalCost += this.costs[effect];
    }
    return totalCost;
  }

  setCost(effect: Effect, cost: number): void {
    this.costs[effect] = cost;
  }
}

// Export instances
export const effectInference = new EffectInferenceEngine();
export const effectHandlers = new EffectHandlerRegistry();
export const effectCostTracker = new EffectCostTracker();
