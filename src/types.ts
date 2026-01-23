/**
 * Core type definitions for the Agentic language
 */

export interface SourceLocation {
  line: number;
  column: number;
  offset: number;
}

export interface SourceRange {
  start: SourceLocation;
  end: SourceLocation;
}

// AST Node Types
export type ASTNode =
  | FunctionDeclaration
  | VariableDeclaration
  | IfStatement
  | ReturnStatement
  | BinaryExpression
  | CallExpression
  | Identifier
  | Literal
  | BlockStatement
  | MatchExpression
  | ErrorRecovery;

export interface BaseNode {
  type: string;
  loc?: SourceRange;
}

export interface FunctionDeclaration extends BaseNode {
  type: 'FunctionDeclaration';
  name: string;
  params: Parameter[];
  returnType: TypeAnnotation | null;
  body: BlockStatement;
  annotations: Annotation[];
}

export interface Parameter {
  name: string;
  typeAnnotation: TypeAnnotation | null;
}

export interface TypeAnnotation {
  kind: 'primitive' | 'union' | 'result' | 'custom';
  value: string | TypeAnnotation[];
}

export interface Annotation {
  name: string;
  args: Record<string, any>;
  loc?: SourceRange;
}

export interface VariableDeclaration extends BaseNode {
  type: 'VariableDeclaration';
  name: string;
  initializer: ASTNode | null;
  typeAnnotation: TypeAnnotation | null;
}

export interface IfStatement extends BaseNode {
  type: 'IfStatement';
  condition: ASTNode;
  consequent: BlockStatement;
  alternate: BlockStatement | IfStatement | null;
}

export interface ReturnStatement extends BaseNode {
  type: 'ReturnStatement';
  argument: ASTNode | null;
}

export interface BinaryExpression extends BaseNode {
  type: 'BinaryExpression';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface CallExpression extends BaseNode {
  type: 'CallExpression';
  callee: ASTNode;
  arguments: ASTNode[];
}

export interface Identifier extends BaseNode {
  type: 'Identifier';
  name: string;
}

export interface Literal extends BaseNode {
  type: 'Literal';
  value: string | number | boolean | null;
  raw: string;
}

export interface BlockStatement extends BaseNode {
  type: 'BlockStatement';
  body: ASTNode[];
}

export interface MatchExpression extends BaseNode {
  type: 'MatchExpression';
  discriminant: ASTNode;
  cases: MatchCase[];
}

export interface MatchCase {
  pattern: string; // "Ok" | "Err" | "_"
  binding?: string; // Variable name
  body: ASTNode;
}

export interface ErrorRecovery extends BaseNode {
  type: 'ErrorRecovery';
  binding: string;
  contextBlock: ContextBlock;
  errorAction: ASTNode;
}

export interface ContextBlock {
  what_failed?: string;
  what_i_tried?: string;
  current_state?: Record<string, any>;
  likely_cause?: string;
  suggestions?: string[];
  recovery?: {
    action: string;
    command?: string;
  };
}

// Transpiler configuration
export interface TranspilerOptions {
  sourceMap?: boolean;
  target?: 'ES2020' | 'ES2015' | 'ESNext';
  includeRuntime?: boolean;
  outputPath?: string;
}

// Compilation result
export interface CompilationResult {
  code: string;
  sourceMap?: string;
  diagnostics: Diagnostic[];
  propertyTests?: PropertyTest[];
}

export interface Diagnostic {
  severity: 'error' | 'warning' | 'info';
  message: string;
  location: SourceRange;
  suggestion?: string;
}

export interface PropertyTest {
  name: string;
  description: string;
  testCode: string;
}