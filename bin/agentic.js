#!/usr/bin/env node

/**
 * Agentic CLI - Main entry point
 * Run after npm install: agentic --help
 */

const { program } = require('commander');
const fs = require('fs');
const path = require('path');

program
  .name('agentic')
  .description('🌟 Agentic - AI-Native Programming Language\n\n  The first language with verified confidence, formal verification, and multi-agent primitives.')
  .version('0.2.0');

// Compile command
program
  .command('compile <input>')
  .description('Compile an .agentic file to TypeScript')
  .option('-o, --output <path>', 'Output file path')
  .option('--verify', 'Run formal verification with Z3')
  .option('--generate-tests', 'Generate property-based tests')
  .action((input, options) => {
    console.log(`✨ Compiling ${input}...`);
    console.log('⚠️  Full compiler coming soon! For now, try examples in:');
    console.log('   examples/showcase.agentic');
    console.log('\n📚 Learn more: agentic learn');
  });

// Learn command - shows getting started guide
program
  .command('learn')
  .description('Interactive tutorial and getting started guide')
  .action(() => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          🌟 Welcome to Agentic! 🌟                         ║
║          The AI-Native Programming Language                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

📖 QUICK START:

1️⃣  Create your first program:

   cat > hello.agentic << 'EOF'
   @confidence(0.95)
   @complete
   func greet(name: string) -> string {
     return "Hello, " + name + "!"
   }
   EOF

2️⃣  Compile it:

   agentic compile hello.agentic

3️⃣  Key features to try:

   • Confidence tracking: @confidence(0.95)
   • Result types: Result<T, E>
   • Property tests: @property("description")
   • Multi-agent: @agent, Channel<T>
   • Verification: @verify(solver: "z3")

📚 LEARN MORE:

   • Tutorials: https://github.com/VyasSathya/AgenticLang/tree/main/docs/tutorials
   • Examples: Check the examples/ directory
   • Cookbook: https://github.com/VyasSathya/AgenticLang/tree/main/docs/cookbook

🔗 RESOURCES:

   • GitHub: https://github.com/VyasSathya/AgenticLang
   • Playground: Try online examples
   • Docs: Complete language reference

🤝 GET HELP:

   • GitHub Issues: Report bugs or ask questions
   • GitHub Discussions: Community discussions
   • Examples: See examples/ directory for code

💡 TIP: Run 'agentic examples' to see all example files!
`);
  });

// Examples command - lists all examples
program
  .command('examples')
  .description('List all example .agentic files')
  .action(() => {
    console.log('📁 Example Programs:\n');

    const examplesDir = path.join(__dirname, '..', 'examples');

    if (fs.existsSync(examplesDir)) {
      const files = fs.readdirSync(examplesDir).filter(f => f.endsWith('.agentic'));

      files.forEach((file, i) => {
        console.log(`  ${i + 1}. ${file}`);
      });

      console.log(`\n✨ Total: ${files.length} examples`);
      console.log(`\n📖 To view an example:`);
      console.log(`   cat examples/${files[0]}`);
      console.log(`\n🔨 To compile an example:`);
      console.log(`   agentic compile examples/${files[0]}`);
    } else {
      console.log('Examples directory not found.');
      console.log('View examples online: https://github.com/VyasSathya/AgenticLang/tree/main/examples');
    }
  });

// Docs command
program
  .command('docs')
  .description('Open documentation in browser')
  .action(() => {
    console.log('📚 Agentic Documentation:\n');
    console.log('   GitHub: https://github.com/VyasSathya/AgenticLang');
    console.log('   Tutorials: https://github.com/VyasSathya/AgenticLang/tree/main/docs/tutorials');
    console.log('   Cookbook: https://github.com/VyasSathya/AgenticLang/tree/main/docs/cookbook');
    console.log('   Examples: https://github.com/VyasSathya/AgenticLang/tree/main/examples');
  });

// Tutorial command
program
  .command('tutorial')
  .description('Start the interactive tutorial')
  .action(() => {
    console.log('🎓 Agentic Tutorial:\n');
    console.log('Start with Tutorial 1: Hello World');
    console.log('https://github.com/VyasSathya/AgenticLang/blob/main/docs/tutorials/01-hello-world.md');
    console.log('\nOr explore examples locally:');
    console.log('  agentic examples');
  });

// Show what makes Agentic special
program
  .command('why')
  .description('Learn why Agentic is revolutionary')
  .action(() => {
    console.log(`
🌟 WHY AGENTIC?

Agentic is the world's first AI-native programming language with:

1️⃣  VERIFIED CONFIDENCE
    @confidence(0.95) ← Validated by tests + Z3 + statistics
    No more guessing if AI code is reliable!

2️⃣  MULTI-AGENT PRIMITIVES
    @agent, Channel<T>, @session_aware
    Coordinate AI agents with type safety

3️⃣  FORMAL VERIFICATION
    @verify(solver: "z3") ← Mathematical proofs
    Catch bugs before runtime

4️⃣  EFFECT SYSTEM
    @effects(llm_call, cost) ← Track side effects
    Know what your code does and costs

5️⃣  INCREMENTAL CORRECTNESS
    @stub → @partial → @complete
    Progressive development in the type system

6️⃣  AI-READABLE ERRORS
    Structured error recovery for self-healing agents

📖 Read more: https://github.com/VyasSathya/AgenticLang/blob/main/blog/001-introducing-agentic.md
`);
  });

// If no command, show help
program.parse();

if (!process.argv.slice(2).length) {
  program.outputHelp();
  console.log('\n💡 Try: agentic learn   (for getting started guide)');
  console.log('💡 Try: agentic examples (to see example programs)');
}
