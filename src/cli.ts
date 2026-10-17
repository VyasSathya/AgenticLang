#!/usr/bin/env node

/**
 * Agentic CLI
 * Command-line interface for the Agentic transpiler
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { Parser } from './parser/parser';
import { TypeScriptGenerator } from './generator/typescript-generator';
import chokidar from 'chokidar';

const program = new Command();

program
  .name('agentic')
  .description('Agentic programming language transpiler')
  .version('0.1.0');

program
  .command('compile <input>')
  .description('Compile an .agentic file to TypeScript')
  .option('-o, --output <path>', 'Output file path')
  .option('--source-map', 'Generate source map')
  .action((input: string, options) => {
    try {
      const result = compileFile(input, options);
      console.log(`✓ Compiled ${input} → ${result.outputPath}`);

      if (result.diagnostics.length > 0) {
        console.log('\nDiagnostics:');
        result.diagnostics.forEach(d => {
          console.log(`  [${d.severity}] ${d.message} at line ${d.location.start.line}`);
        });
      }
    } catch (error) {
      console.error('✗ Compilation failed:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('watch <pattern>')
  .description('Watch .agentic files and recompile on change')
  .option('-o, --output-dir <dir>', 'Output directory')
  .action((pattern: string, options) => {
    console.log(`Watching: ${pattern}`);

    const watcher = chokidar.watch(pattern, {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100,
      },
    });

    watcher
      .on('add', (file) => {
        console.log(`\nFile added: ${file}`);
        try {
          compileFile(file, options);
          console.log(`✓ Compiled ${file}`);
        } catch (error) {
          console.error(`✗ Error compiling ${file}:`, (error as Error).message);
        }
      })
      .on('change', (file) => {
        console.log(`\nFile changed: ${file}`);
        try {
          compileFile(file, options);
          console.log(`✓ Recompiled ${file}`);
        } catch (error) {
          console.error(`✗ Error compiling ${file}:`, (error as Error).message);
        }
      })
      .on('error', (error) => {
        console.error('Watcher error:', error);
      });

    console.log('\nPress Ctrl+C to stop watching...');

    process.on('SIGINT', () => {
      console.log('\nStopping watcher...');
      watcher.close();
      process.exit(0);
    });
  });

program
  .command('version')
  .description('Show version information')
  .action(() => {
    console.log('Agentic v0.1.0');
    console.log('An AI-native programming language');
  });

function compileFile(inputPath: string, options: any) {
  // Read source file
  const source = fs.readFileSync(inputPath, 'utf-8');

  // Parse
  const parser = new Parser();
  const ast = parser.parse(source);

  // Generate TypeScript
  const generator = new TypeScriptGenerator(inputPath);
  const code = generator.generate(ast);

  // Determine output path
  const outputPath = options.output || inputPath.replace('.agentic', '.ts');

  // Write output
  fs.writeFileSync(outputPath, code, 'utf-8');

  // Write source map if requested
  if (options.sourceMap) {
    const sourceMapPath = outputPath + '.map';
    fs.writeFileSync(sourceMapPath, generator.getSourceMap(), 'utf-8');
  }

  return {
    outputPath,
    diagnostics: [] as any[],
  };
}

program.parse();