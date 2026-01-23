/**
 * Console Formatter for Diagnostics
 * Rust-inspired beautiful error messages with colors
 */

import { Diagnostic, DiagnosticSeverity, AgentDiagnostic } from './diagnostic';

export interface FormatterOptions {
  colors: boolean;
  snippetContext: number; // Lines of context
  showUrl: boolean;
  showFixes: boolean;
  format: 'human' | 'json' | 'compact';
}

const DEFAULT_OPTIONS: FormatterOptions = {
  colors: true,
  snippetContext: 2,
  showUrl: true,
  showFixes: true,
  format: 'human',
};

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  boldRed: '\x1b[1;31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  boldMagenta: '\x1b[1;35m',
  cyan: '\x1b[36m',
  boldCyan: '\x1b[1;36m',
  white: '\x1b[37m',
};

export class DiagnosticFormatter {
  constructor(private options: FormatterOptions = DEFAULT_OPTIONS) {}

  format(diagnostic: Diagnostic): string {
    if (this.options.format === 'json') {
      return this.formatJson(diagnostic);
    }
    if (this.options.format === 'compact') {
      return this.formatCompact(diagnostic);
    }
    return this.formatHuman(diagnostic);
  }

  formatMany(diagnostics: Diagnostic[]): string {
    if (this.options.format === 'json') {
      return JSON.stringify(diagnostics, null, 2);
    }

    return diagnostics
      .map((d) => this.format(d))
      .join('\n\n');
  }

  private formatHuman(d: Diagnostic): string {
    const { colors: useColors } = this.options;

    // Header: error[P001]: expected `;`, found `}`
    const header = this.formatHeader(d, useColors);

    // Location: --> example.agentic:5:20
    const location = this.formatLocation(d, useColors);

    // Code snippet with highlighting
    const snippet = this.formatSnippet(d, useColors);

    // Help/Note
    const notes = this.formatNotes(d, useColors);

    // Suggested fixes
    const fixes = this.options.showFixes && d.suggestedFixes
      ? this.formatFixes(d, useColors)
      : '';

    // URL
    const url = this.options.showUrl && d.url
      ? this.formatUrl(d, useColors)
      : '';

    return [header, location, snippet, notes, fixes, url]
      .filter(Boolean)
      .join('\n');
  }

  private formatHeader(d: Diagnostic, useColors: boolean): string {
    const severityStr = d.severity;
    const codeStr = `[${d.code}]`;
    const messageStr = d.message;

    if (!useColors) {
      return `${severityStr}${codeStr}: ${messageStr}`;
    }

    let colorCode = colors.boldRed;
    if (d.severity === DiagnosticSeverity.Warning) {
      colorCode = colors.boldMagenta;
    } else if (d.severity === DiagnosticSeverity.Info) {
      colorCode = colors.boldCyan;
    }

    return `${colorCode}${severityStr}${codeStr}${colors.reset}: ${colors.bold}${messageStr}${colors.reset}`;
  }

  private formatLocation(d: Diagnostic, useColors: boolean): string {
    const loc = d.location;
    const locStr = `${loc.start.line}:${loc.start.column}`;

    if (!useColors) {
      return `  --> ${locStr}`;
    }

    return `${colors.blue}  -->${colors.reset} ${colors.white}${locStr}${colors.reset}`;
  }

  private formatSnippet(d: Diagnostic, useColors: boolean): string {
    if (!d.location.source) return '';

    const lines = d.location.source.split('\n');
    const errorLine = d.location.start.line - 1;

    const start = Math.max(0, errorLine - this.options.snippetContext);
    const end = Math.min(lines.length, errorLine + this.options.snippetContext + 1);

    const maxLineNum = end.toString().length;
    const result: string[] = [useColors ? `${colors.blue}   |${colors.reset}` : '   |'];

    for (let i = start; i < end; i++) {
      const lineNum = (i + 1).toString().padStart(maxLineNum, ' ');
      const line = lines[i];

      if (i === errorLine) {
        // Highlight error line
        result.push(
          useColors
            ? `${colors.blue} ${lineNum} |${colors.reset} ${line}`
            : ` ${lineNum} | ${line}`
        );

        // Add caret line
        const col = d.location.start.column;
        const len = d.location.end.column - d.location.start.column;
        const caret = ' '.repeat(col) + '^'.repeat(Math.max(1, len));

        result.push(
          useColors
            ? `${colors.blue}   |${colors.reset} ${colors.boldRed}${caret}${colors.reset}`
            : `   | ${caret}`
        );

        // Add help on caret line if present
        if (d.help) {
          const helpStr = useColors
            ? `${colors.blue}   |${colors.reset} ${colors.cyan}help: ${d.help}${colors.reset}`
            : `   | help: ${d.help}`;
          result.push(helpStr);
        }
      } else {
        result.push(
          useColors
            ? `${colors.blue} ${lineNum} |${colors.reset} ${line}`
            : ` ${lineNum} | ${line}`
        );
      }
    }

    result.push(useColors ? `${colors.blue}   |${colors.reset}` : '   |');

    return result.join('\n');
  }

  private formatNotes(d: Diagnostic, useColors: boolean): string {
    const notes: string[] = [];

    if (d.note) {
      const noteStr = useColors
        ? `${colors.boldCyan}   = note:${colors.reset} ${d.note}`
        : `   = note: ${d.note}`;
      notes.push(noteStr);
    }

    if (d.possibleCauses && d.possibleCauses.length > 0) {
      const header = useColors
        ? `${colors.yellow}${colors.bold}   = possible causes:${colors.reset}`
        : '   = possible causes:';
      notes.push(header);
      d.possibleCauses.forEach((cause) => {
        notes.push(`     - ${cause}`);
      });
    }

    return notes.join('\n');
  }

  private formatFixes(d: Diagnostic, useColors: boolean): string {
    if (!d.suggestedFixes || d.suggestedFixes.length === 0) {
      return '';
    }

    const header = useColors
      ? `${colors.green}${colors.bold}   = suggested fixes:${colors.reset}`
      : '   = suggested fixes:';

    const fixes = d.suggestedFixes.map((fix, i) => {
      const num = `${i + 1}.`;
      const desc = fix.description;
      const cmd = fix.command ? `\n       $ ${fix.command}` : '';
      return `     ${num} ${desc}${cmd}`;
    });

    return [header, ...fixes].join('\n');
  }

  private formatUrl(d: Diagnostic, useColors: boolean): string {
    if (!d.url) return '';

    const prefix = useColors
      ? `${colors.blue}   = see:${colors.reset} `
      : '   = see: ';

    return prefix + d.url;
  }

  private formatJson(d: Diagnostic): string {
    return JSON.stringify(d, null, 2);
  }

  private formatCompact(d: Diagnostic): string {
    const loc = d.location;
    return `${d.severity}[${d.code}]: ${d.message} (${loc.start.line}:${loc.start.column})`;
  }
}

// AI-friendly formatter
export class AgentFormatter {
  formatForAgent(diagnostic: Diagnostic, filePath: string): AgentDiagnostic {
    return {
      type: 'compilation_error',
      code: diagnostic.code,
      severity: diagnostic.severity,
      message: diagnostic.message,
      location: {
        file: filePath,
        line: diagnostic.location.start.line,
        column: diagnostic.location.start.column,
        snippet: this.extractSnippet(diagnostic),
      },
      analysis: {
        possibleCauses: diagnostic.possibleCauses || [],
        suggestedFixes: (diagnostic.suggestedFixes || []).map((fix) => ({
          description: fix.description,
          command: fix.command,
          code_edit: fix.edit ? {
            before: this.getBeforeText(diagnostic, fix),
            after: fix.edit.newText,
          } : undefined,
        })),
        relatedErrors: [],
        confidence: this.calculateFixConfidence(diagnostic),
      },
      machineReadable: {
        errorCategory: this.categorizeError(diagnostic.code),
        canAutoFix: this.canAutoFix(diagnostic),
        fixable: !!diagnostic.suggestedFixes && diagnostic.suggestedFixes.length > 0,
        breakingChange: false,
      },
    };
  }

  private categorizeError(code: string): string {
    if (code.startsWith('L')) return 'lexical';
    if (code.startsWith('P')) return 'syntax';
    if (code.startsWith('T')) return 'type';
    if (code.startsWith('A')) return 'annotation';
    return 'semantic';
  }

  private canAutoFix(diagnostic: Diagnostic): boolean {
    const autoFixableCodes = ['P002', 'L002', 'A002'];
    return autoFixableCodes.some(code => diagnostic.code.includes(code));
  }

  private calculateFixConfidence(diagnostic: Diagnostic): number {
    if (diagnostic.code.includes('P002')) return 0.95; // Missing token - high confidence
    if (diagnostic.suggestedFixes && diagnostic.suggestedFixes.length === 1) return 0.85;
    return 0.60;
  }

  private extractSnippet(diagnostic: Diagnostic): string {
    if (!diagnostic.location.source) return '';
    const lines = diagnostic.location.source.split('\n');
    const errorLine = diagnostic.location.start.line - 1;
    return lines[errorLine] || '';
  }

  private getBeforeText(diagnostic: Diagnostic, fix: any): string {
    if (!fix.edit || !diagnostic.location.source) return '';
    const lines = diagnostic.location.source.split('\n');
    const line = lines[diagnostic.location.start.line - 1];
    return line?.substring(
      fix.edit.range.start.column,
      fix.edit.range.end.column
    ) || '';
  }
}
