# Agentic Programming Language - Complete Project Overview

## What Is This?

**Agentic** is the world's first AI-native programming language with uncertainty, incremental correctness, and verification as first-class citizens.

## The Problem

Current programming languages assume:
- Developers know everything upfront
- Code is either complete or broken
- Errors are simple strings
- Context is implicit

But AI agents:
- Are probabilistic (uncertain)
- Work iteratively (code evolves)
- Need structured error context
- Require explicit dependencies

## The Solution

Agentic embraces how AI agents actually work:

### 1. Uncertainty is Explicit
```agentic
@confidence(0.60)  // I'm only 60% sure
@uncertain("Multiple date formats possible")
func parseDate(input: string) -> Date
```

### 2. Incremental Development
```agentic
@stub → @partial → @complete
```
Each stage compiles and runs.

### 3. Rich Error Context
```agentic
or error {
    @context {
        what_failed: "...",
        suggestions: ["...", "..."],
        recovery: { action: "fix_and_retry" }
    }
}
```

### 4. Explicit Context
```agentic
@needs(database: Database, logger: Logger)
func saveUser(user: User)
```
Compiler checks dependencies.

## Project Structure

```
agentic-lang/
│
├── src/                          # Transpiler source code
│   ├── parser/
│   │   ├── lexer.ts              # Tokenization (regex-based)
│   │   └── parser.ts             # Recursive descent parser
│   ├── generator/
│   │   └── typescript-generator.ts  # AST → TypeScript
│   ├── runtime/
│   │   └── index.ts              # Runtime library (Result, confidence, health)
│   ├── property-tests/
│   │   └── generator.ts          # Auto-generate fast-check tests
│   ├── types.ts                  # AST and type definitions
│   ├── index.ts                  # Public API exports
│   └── cli.ts                    # Command-line interface
│
├── bin/
│   └── agentic.js                # Executable entry point
│
├── examples/                     # Example .agentic code
│   ├── auth.agentic              # Authentication with confidence
│   └── simple.agentic            # Basic syntax
│
├── vscode-extension/             # VS Code extension
│   ├── syntaxes/
│   │   └── agentic.tmLanguage.json  # TextMate grammar
│   ├── language-configuration.json  # Brackets, comments
│   └── package.json              # Extension manifest
│
├── docs/                         # Documentation
│   ├── SPECIFICATION.md          # Language spec
│   ├── QUICK_START.md            # Getting started
│   └── RESEARCH.md               # Research foundation
│
├── tests/                        # Test suite
│   ├── parser.test.ts            # Parser tests
│   └── transpiler.test.ts        # End-to-end tests
│
├── package.json                  # Main package config
├── tsconfig.json                 # TypeScript configuration
├── vitest.config.ts              # Test configuration
├── README.md                     # Project readme
├── CONTRIBUTING.md               # Contribution guide
└── LICENSE                       # MIT License
```

## Technology Stack

### Language Implementation
- **Parser**: Regex-based lexer + recursive descent parser
- **Code Generation**: String templates with source maps
- **Target**: TypeScript → JavaScript
- **Runtime**: Node.js with runtime library

### Dependencies
- `tree-sitter` - AST parsing (for future enhancement)
- `tree-sitter-typescript` - TypeScript support
- `chokidar` - File watching
- `commander` - CLI framework
- `source-map` - Debugging support

### Development
- `typescript` - Compiler
- `vitest` - Testing framework
- `fast-check` - Property-based testing
- `@vscode/vsce` - Extension packaging

## Key Features Implemented

### ✅ Phase 1: Transpiler MVP
- [x] Lexer (tokenization)
- [x] Parser (AST generation)
- [x] TypeScript code generator
- [x] Source map support
- [x] CLI interface (`compile`, `watch`)
- [x] Runtime library (Result, confidence, health)

### ✅ Phase 2: Property Tests
- [x] Property extraction from annotations
- [x] fast-check test generation
- [x] Arbitrary generation from types

### ✅ Phase 3: VSCode Extension
- [x] TextMate syntax grammar
- [x] Language configuration
- [x] Bracket matching, auto-closing
- [x] Comment toggling

### ✅ Phase 4: Documentation
- [x] README with examples
- [x] Language specification
- [x] Quick start guide
- [x] Research foundation
- [x] Contributing guide

## How to Use

### 1. Build the Transpiler

```bash
cd /c/Dev/agentic-lang
npm install
npm run build
```

### 2. Compile an Example

```bash
./bin/agentic.js compile examples/simple.agentic
cat examples/simple.ts  # View generated TypeScript
```

### 3. Watch Mode

```bash
./bin/agentic.js watch "examples/**/*.agentic"
```

### 4. Install VSCode Extension

```bash
cd vscode-extension
npm install
code .
# Press F5 to test in Extension Development Host
```

## What Makes This Groundbreaking

### 1. First Language with Confidence as a Type
Not just comments - compiler tracks and warns when confidence < 0.80

### 2. Incremental Correctness Built-In
Every stage (@stub, @partial, @complete) is valid code

### 3. Error Context is Structured Data
Errors include suggestions, recovery steps, and context - not just strings

### 4. Context as Types
`@needs()` makes dependencies explicit; compiler proves availability

### 5. Property Tests Auto-Generate
AI extracts properties from code; 1000 random tests per function

## Research Foundation

Based on comprehensive research across:
- **Probabilistic programming** (Pyro, RxInfer.jl)
- **Gradual typing** (TypeScript, Rust)
- **Effect systems** (Koka, Scala)
- **Property-based testing** (Hypothesis, fast-check)
- **Self-healing systems** (Kubernetes)
- **Patch theory** (Darcs, Pijul)
- **AI agent failure modes** (40+ research papers)

See [docs/RESEARCH.md](docs/RESEARCH.md) for full references.

## Roadmap

### Near-term (Weeks)
- [ ] Language Server Protocol (LSP) for IntelliSense
- [ ] Debug Adapter Protocol (DAP)
- [ ] Standard library (common functions)
- [ ] Improved error messages

### Mid-term (Months)
- [ ] Type inference engine
- [ ] Self-healing runtime implementation
- [ ] Approval protocol for human-AI collaboration
- [ ] Session handoff protocol

### Long-term (Quarters)
- [ ] Native compiler (Rust → LLVM)
- [ ] Formal verification integration
- [ ] WASM compilation target
- [ ] Multi-language interop

## Success Metrics

### Correctness
- [ ] 95%+ test coverage
- [ ] 1000+ property tests per function
- [ ] Zero known security vulnerabilities

### Performance
- [ ] < 100ms compile time per file
- [ ] < 500ms hot reload
- [ ] < 10MB memory per file

### Developer Experience
- [ ] Syntax highlighting in major IDEs
- [ ] Clear error messages with suggestions
- [ ] 50% reduction in debugging time

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE)

---

**Version:** 0.1.0
**Status:** MVP / Proof of Concept
**Last Updated:** January 2026
