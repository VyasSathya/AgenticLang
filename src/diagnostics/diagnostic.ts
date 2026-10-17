/**
 * Structured Diagnostic System for Agentic
 * Based on Rust compiler diagnostics with AI-agent enhancements
 */

export enum DiagnosticSeverity {
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
  Hint = 'hint',
}

export enum DiagnosticCode {
  // Lexer errors (L-series)
  L001_UNEXPECTED_CHARACTER = 'L001',
  L002_UNTERMINATED_STRING = 'L002',
  L003_INVALID_NUMBER = 'L003',

  // Parser errors (P-series)
  P001_UNEXPECTED_TOKEN = 'P001',
  P002_EXPECTED_TOKEN = 'P002',
  P003_INVALID_SYNTAX = 'P003',
  P004_MISSING_ANNOTATION_ARG = 'P004',
  P005_INVALID_MATCH_PATTERN = 'P005',

  // Type errors (T-series)
  T001_TYPE_MISMATCH = 'T001',
  T002_UNDEFINED_IDENTIFIER = 'T002',
  T003_INVALID_RESULT_TYPE = 'T003',
  T004_MISSING_TYPE_ANNOTATION = 'T004',

  // Annotation errors (A-series)
  A001_UNKNOWN_ANNOTATION = 'A001',
  A002_INVALID_CONFIDENCE_VALUE = 'A002',
  A003_MISSING_DEPENDENCY = 'A003',
  A004_INVALID_STAGE = 'A004',
  A005_LOW_CONFIDENCE = 'A005',
}

export interface SourceLocation {
  line: number;
  column: number;
  offset: number;
}

export interface SourceRange {
  start: SourceLocation;
  end: SourceLocation;
  source?: string; // Original source text
}

export interface DiagnosticFix {
  description: string;
  command?: string; // CLI command to fix
  edit?: {
    range: SourceRange;
    newText: string;
  };
}

export interface Diagnostic {
  code: DiagnosticCode;
  severity: DiagnosticSeverity;
  message: string;
  location: SourceRange;

  // Human-friendly
  help?: string; // Short hint
  note?: string; // Additional context
  url?: string; // Link to documentation

  // AI-friendly
  suggestedFixes?: DiagnosticFix[];
  possibleCauses?: string[];
  relatedInformation?: Array<{
    location: SourceRange;
    message: string;
  }>;

  // Context for debugging
  context?: {
    expectedToken?: string;
    actualToken?: string;
    availableIdentifiers?: string[];
    [key: string]: any;
  };
}

export class DiagnosticBuilder {
  private diagnostic: Partial<Diagnostic>;

  constructor(code: DiagnosticCode) {
    this.diagnostic = {
      code,
      severity: DiagnosticSeverity.Error,
    };
  }

  at(location: SourceRange): this {
    this.diagnostic.location = location;
    return this;
  }

  withMessage(message: string): this {
    this.diagnostic.message = message;
    return this;
  }

  withHelp(help: string): this {
    this.diagnostic.help = help;
    return this;
  }

  withNote(note: string): this {
    this.diagnostic.note = note;
    return this;
  }

  withUrl(url: string): this {
    this.diagnostic.url = url;
    return this;
  }

  suggestFix(fix: DiagnosticFix): this {
    if (!this.diagnostic.suggestedFixes) {
      this.diagnostic.suggestedFixes = [];
    }
    this.diagnostic.suggestedFixes.push(fix);
    return this;
  }

  addCause(cause: string): this {
    if (!this.diagnostic.possibleCauses) {
      this.diagnostic.possibleCauses = [];
    }
    this.diagnostic.possibleCauses.push(cause);
    return this;
  }

  withContext(context: Record<string, any>): this {
    this.diagnostic.context = { ...this.diagnostic.context, ...context };
    return this;
  }

  asSeverity(severity: DiagnosticSeverity): this {
    this.diagnostic.severity = severity;
    return this;
  }

  build(): Diagnostic {
    if (!this.diagnostic.location || !this.diagnostic.message) {
      throw new Error('Diagnostic must have location and message');
    }
    return this.diagnostic as Diagnostic;
  }
}

// Convenience function
export function diagnostic(code: DiagnosticCode): DiagnosticBuilder {
  return new DiagnosticBuilder(code);
}

// AI-friendly structured format
export interface AgentDiagnostic {
  type: 'compilation_error';
  code: string;
  severity: string;
  message: string;
  location: {
    file: string;
    line: number;
    column: number;
    snippet: string;
  };
  analysis: {
    possibleCauses: string[];
    suggestedFixes: Array<{
      description: string;
      command?: string;
      code_edit?: {
        before: string;
        after: string;
      };
    }>;
    relatedErrors?: string[];
    confidence: number; // 0-1, how confident the fix is
  };
  machineReadable: {
    errorCategory: string; // 'syntax' | 'type' | 'annotation' | 'semantic'
    canAutoFix: boolean;
    fixable: boolean;
    breakingChange: boolean;
  };
}
