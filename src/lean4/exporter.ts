/**
 * Lean4 Theorem Prover Export
 * Converts Agentic functions to Lean4 for formal verification
 */

import * as AST from '../types';

export interface Lean4Export {
  definitions: string[];
  theorems: string[];
  proofs: string[];
}

export class Lean4Exporter {
  export(ast: AST.ASTNode[]): Lean4Export {
    const definitions: string[] = [];
    const theorems: string[] = [];
    const proofs: string[] = [];

    for (const node of ast) {
      if (node.type === 'FunctionDeclaration') {
        const func = node as AST.FunctionDeclaration;

        // Only export @complete functions
        if (func.annotations.some(a => a.name === 'complete')) {
          definitions.push(this.exportFunction(func));

          // Generate theorem from contracts
          const contractAnnotation = func.annotations.find(a => a.name === 'contract');
          if (contractAnnotation) {
            theorems.push(this.exportTheorem(func, contractAnnotation));
          }
        }
      }
    }

    return { definitions, theorems, proofs };
  }

  private exportFunction(func: AST.FunctionDeclaration): string {
    const params = this.generateLean4Params(func.params);
    const returnType = this.generateLean4Type(func.returnType);

    return `
def ${func.name} ${params} : ${returnType} :=
  sorry  -- Implementation or proof goes here

`;
  }

  private exportTheorem(
    func: AST.FunctionDeclaration,
    contractAnnotation: AST.Annotation
  ): string {
    const params = this.generateLean4Params(func.params);
    const proposition = this.contractToProposition(func, contractAnnotation);

    return `
theorem ${func.name}_correct ${params} :
  ${proposition} := by
  sorry  -- Proof obligation

`;
  }

  private contractToProposition(
    func: AST.FunctionDeclaration,
    contract: AST.Annotation
  ): string {
    const requires = contract.args.requires || [];
    const ensures = contract.args.ensures || [];

    const preconditions = Array.isArray(requires)
      ? requires.map(r => this.translateToLean4Logic(r))
      : [];

    const postconditions = Array.isArray(ensures)
      ? ensures.map(e => this.translateToLean4Logic(e))
      : [];

    // Build proposition: ∀ params, precondition → postcondition
    const paramNames = func.params.map(p => p.name).join(' ');

    if (preconditions.length === 0) {
      return postconditions.join(' ∧ ');
    }

    const preCondition = preconditions.join(' ∧ ');
    const postCondition = postconditions.join(' ∧ ');

    return `${preCondition} → ${postCondition}`;
  }

  private generateLean4Params(params: AST.Parameter[]): string {
    return (
      '(' +
      params
        .map(p => {
          const type = this.generateLean4Type(p.typeAnnotation);
          return `${p.name} : ${type}`;
        })
        .join(') (') +
      ')'
    );
  }

  private generateLean4Type(typeAnnotation: AST.TypeAnnotation | null): string {
    if (!typeAnnotation) {
      return 'Unit'; // void in Lean4
    }

    switch (typeAnnotation.kind) {
      case 'primitive':
        if (typeAnnotation.value === 'number') return 'ℝ'; // Real numbers
        if (typeAnnotation.value === 'string') return 'String';
        if (typeAnnotation.value === 'boolean') return 'Bool';
        if (typeAnnotation.value === 'void') return 'Unit';
        return 'α'; // Generic type

      case 'result':
        // Result<T, E> -> Except E T in Lean4
        if (Array.isArray(typeAnnotation.value) && typeAnnotation.value.length >= 2) {
          const okType = this.generateLean4Type(typeAnnotation.value[0]);
          const errType = this.generateLean4Type(typeAnnotation.value[1]);
          return `Except ${errType} ${okType}`;
        }
        return 'Except String α';

      default:
        return 'α'; // Generic fallback
    }
  }

  private translateToLean4Logic(expression: string): string {
    // Translate common mathematical expressions to Lean4 syntax

    return expression
      .replace(/&&/g, '∧')
      .replace(/\|\|/g, '∨')
      .replace(/!=/g, '≠')
      .replace(/>=/g, '≥')
      .replace(/<=/g, '≤')
      .replace(/==/g, '=')
      .replace(/!/g, '¬');
  }

  /**
   * Generate complete Lean4 file with all necessary imports
   */
  generateLean4File(ast: AST.ASTNode[], moduleName: string): string {
    const exported = this.export(ast);

    let lean4Code = `-- Auto-generated from Agentic
-- Module: ${moduleName}

import Mathlib.Data.Real.Basic
import Mathlib.Logic.Basic

`;

    // Add definitions
    if (exported.definitions.length > 0) {
      lean4Code += '-- Function Definitions\n';
      lean4Code += exported.definitions.join('\n');
    }

    // Add theorems
    if (exported.theorems.length > 0) {
      lean4Code += '\n-- Theorems\n';
      lean4Code += exported.theorems.join('\n');
    }

    return lean4Code;
  }
}

// Example usage in CLI:
// agentic export --target lean4 myfile.agentic --output myfile.lean
