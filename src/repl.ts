/**
 * Agentic REPL - Interactive playground for learning and experimentation
 */

import * as readline from 'readline';
import { Parser } from './parser/parser';
import { TypeScriptGenerator } from './generator/typescript-generator';
import { AgenticRuntime } from './runtime';

interface ReplContext {
  variables: Map<string, any>;
  functions: Map<string, Function>;
  history: string[];
  confidenceThreshold: number;
}

export class AgenticRepl {
  private context: ReplContext;
  private rl: readline.Interface;
  private parser: Parser;
  private multilineBuffer: string[] = [];
  private inMultilineMode: boolean = false;

  constructor() {
    this.context = {
      variables: new Map(),
      functions: new Map(),
      history: [],
      confidenceThreshold: 0.80,
    };

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'agentic> ',
    });

    this.parser = new Parser();
  }

  start() {
    console.log('🚀 Agentic REPL v0.1.0');
    console.log('Type .help for commands, .exit to quit\n');

    this.rl.prompt();

    this.rl.on('line', (line: string) => {
      this.handleLine(line.trim());
    });

    this.rl.on('close', () => {
      console.log('\n👋 Goodbye!');
      process.exit(0);
    });
  }

  private handleLine(line: string) {
    // Handle special commands
    if (line.startsWith('.')) {
      this.handleCommand(line);
      this.rl.prompt();
      return;
    }

    // Handle empty lines
    if (!line) {
      this.rl.prompt();
      return;
    }

    // Handle multiline input
    if (this.inMultilineMode) {
      if (line === '}') {
        this.multilineBuffer.push(line);
        const code = this.multilineBuffer.join('\n');
        this.multilineBuffer = [];
        this.inMultilineMode = false;
        this.execute(code);
      } else {
        this.multilineBuffer.push(line);
        this.rl.setPrompt('...     > ');
      }
      this.rl.prompt();
      return;
    }

    // Check if starting multiline input
    if (line.startsWith('func') || line.includes('{') && !line.includes('}')) {
      this.inMultilineMode = true;
      this.multilineBuffer.push(line);
      this.rl.setPrompt('...     > ');
      this.rl.prompt();
      return;
    }

    // Execute single line
    this.execute(line);
    this.rl.prompt();
  }

  private handleCommand(cmd: string) {
    const parts = cmd.split(' ');
    const command = parts[0];

    switch (command) {
      case '.help':
        this.showHelp();
        break;

      case '.exit':
      case '.quit':
        this.rl.close();
        break;

      case '.clear':
        console.clear();
        break;

      case '.vars':
        this.showVariables();
        break;

      case '.funcs':
        this.showFunctions();
        break;

      case '.confidence':
        if (parts[1]) {
          this.context.confidenceThreshold = parseFloat(parts[1]);
          console.log(`✓ Confidence threshold set to ${this.context.confidenceThreshold}`);
        } else {
          console.log(`Current confidence threshold: ${this.context.confidenceThreshold}`);
        }
        break;

      case '.history':
        this.showHistory();
        break;

      case '.reset':
        this.context.variables.clear();
        this.context.functions.clear();
        this.context.history = [];
        console.log('✓ Context reset');
        break;

      case '.example':
        this.showExample(parts[1]);
        break;

      default:
        console.log(`Unknown command: ${command}`);
        console.log('Type .help for available commands');
    }
  }

  private execute(code: string) {
    try {
      // Add to history
      this.context.history.push(code);

      // Parse the code
      const ast = this.parser.parse(code);

      // Generate TypeScript
      const generator = new TypeScriptGenerator('<repl>');
      const tsCode = generator.generate(ast);

      // Show generated code in debug mode
      if (process.env.DEBUG) {
        console.log('\n--- Generated TypeScript ---');
        console.log(tsCode);
        console.log('----------------------------\n');
      }

      // Evaluate (simplified - in production would use vm module)
      console.log('✓ Code compiled successfully');
      console.log(`  ${ast.length} statement(s) parsed`);

      // Extract and show confidence annotations
      ast.forEach((node: any) => {
        if (node.type === 'FunctionDeclaration') {
          const confidenceAnnotation = node.annotations?.find((a: any) => a.name === 'confidence');
          if (confidenceAnnotation) {
            const level = confidenceAnnotation.args.arg0 || 0;
            const reason = confidenceAnnotation.args.arg1 || 'No reason provided';

            if (level < this.context.confidenceThreshold) {
              console.log(`  ⚠️  Low confidence (${level}): ${reason}`);
            } else {
              console.log(`  ✓ Confidence: ${level} - ${reason}`);
            }
          }

          const stageAnnotation = node.annotations?.find((a: any) =>
            a.name === 'stub' || a.name === 'partial' || a.name === 'complete'
          );
          if (stageAnnotation) {
            console.log(`  📊 Stage: @${stageAnnotation.name}`);
          }
        }
      });

    } catch (error) {
      console.error('✗ Error:', (error as Error).message);
    }
  }

  private showHelp() {
    console.log(`
Agentic REPL Commands:
  .help              Show this help
  .exit, .quit       Exit REPL
  .clear             Clear screen
  .vars              Show defined variables
  .funcs             Show defined functions
  .confidence <n>    Set confidence threshold (default: 0.80)
  .history           Show command history
  .reset             Reset REPL context
  .example <topic>   Show example code

Examples:
  agentic> @confidence(0.95)
  agentic> func add(a: number, b: number) -> number { return a + b }

  agentic> .confidence 0.70
  agentic> .example result
    `);
  }

  private showVariables() {
    if (this.context.variables.size === 0) {
      console.log('No variables defined');
      return;
    }

    console.log('\nDefined variables:');
    this.context.variables.forEach((value, name) => {
      console.log(`  ${name} = ${JSON.stringify(value)}`);
    });
  }

  private showFunctions() {
    if (this.context.functions.size === 0) {
      console.log('No functions defined');
      return;
    }

    console.log('\nDefined functions:');
    this.context.functions.forEach((_, name) => {
      console.log(`  func ${name}(...)`);
    });
  }

  private showHistory() {
    if (this.context.history.length === 0) {
      console.log('No history');
      return;
    }

    console.log('\nHistory:');
    this.context.history.forEach((cmd, i) => {
      console.log(`  ${i + 1}. ${cmd}`);
    });
  }

  private showExample(topic?: string) {
    const examples: Record<string, string> = {
      result: `@confidence(0.90)
@complete
func divide(a: number, b: number) -> Result<number, string> {
  if b == 0 {
    return Err("Division by zero")
  }
  return Ok(a / b)
}`,

      match: `divide(10, 2) match {
  Ok(result) -> return result,
  Err(error) -> return 0
}`,

      stub: `@stub
@needs(database)
func saveUser(name: string) -> Result<boolean, string> {
  // Not implemented yet
}`,

      partial: `@partial
@confidence(0.65, "Only handles positive numbers")
func factorial(n: number) -> number {
  if n <= 1 {
    return 1
  }
  return n * factorial(n - 1)
}`,

      error: `result = apiCall() or error {
  @context {
    what_failed: "API call",
    suggestions: ["Check network", "Retry"],
    recovery: { action: "use_cache" }
  }
  return useCachedData()
}`,
    };

    if (!topic) {
      console.log('\nAvailable examples:');
      console.log('  result   - Result type and error handling');
      console.log('  match    - Pattern matching');
      console.log('  stub     - Stub functions');
      console.log('  partial  - Partial implementation');
      console.log('  error    - Error recovery blocks');
      console.log('\nUsage: .example <topic>');
      return;
    }

    const example = examples[topic.toLowerCase()];
    if (example) {
      console.log(`\nExample: ${topic}`);
      console.log('─'.repeat(40));
      console.log(example);
      console.log('─'.repeat(40));
    } else {
      console.log(`Unknown example: ${topic}`);
      console.log('Type .example to see available examples');
    }
  }
}

// CLI entry point
if (require.main === module) {
  const repl = new AgenticRepl();
  repl.start();
}
