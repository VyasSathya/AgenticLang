# Agentic Programming Language

> An AI-native programming language with uncertainty, incremental correctness, and verification as first-class citizens.

## Overview

Agentic is a revolutionary programming language designed specifically for AI agents. It addresses the core challenges AI faces when writing code:
- **Uncertainty is explicit** - Confidence scores on all operations
- **Incremental development** - Code valid at every stage (@stub, @partial, @complete)
- **Rich error context** - Errors are structured data with recovery suggestions
- **Self-verification** - Property-based tests auto-generate from code
- **Session continuity** - Structured handoffs prevent context loss

## Quick Start

```bash
# Install dependencies
npm install

# Build the transpiler
npm run build

# Compile an .agentic file to TypeScript
./bin/agentic.js compile examples/auth.agentic --output examples/auth.ts

# Watch mode
./bin/agentic.js watch examples/
```

## Example Code

```agentic
@confidence(0.90)
@needs(database: Database, jwt_secret: string)
func authenticate(token: string) -> Result<User, AuthError> {
    // Validate input
    @confident(0.99)
    if token.isEmpty() {
        return Err(AuthError.MISSING_TOKEN)
    }

    // Decode with uncertainty
    @uncertain("Edge case: malformed but decodable tokens?")
    decoded = jwt.decode(token, jwt_secret) match {
        Ok(payload) -> payload,
        Err(e) -> {
            @context {
                what_failed: "JWT decode",
                suggestions: ["Check token format", "Verify JWT_SECRET"]
            }
            return Err(AuthError.INVALID_TOKEN)
        }
    }

    return Ok(User.fromDict(decoded))
}

// Auto-generated property tests
@property("rejects empty tokens")
@property("rejects invalid tokens")
@property("accepts valid tokens")
```

## Language Features

### 1. Confidence Annotations
- `@confidence(0.90)` - Declare how confident the AI is
- Compiler warns when confidence < 0.80
- Helps humans focus review efforts

### 2. Incremental Stages
- `@stub` - Not implemented, returns error
- `@partial` - Works for subset of inputs
- `@complete` - Full implementation with verification

### 3. Context Requirements
- `@needs(database, logger)` - Explicit dependencies
- Compiler checks availability at call sites
- No more "where did this variable come from?"

### 4. Rich Errors
- Errors include suggestions and recovery steps
- Structured data, not strings
- AI agents can programmatically fix errors

### 5. Property-Based Testing
- Properties auto-extracted from code
- 1000 random test cases per function
- Shrinking to minimal failing case

### 6. Self-Healing Runtime
- Health checks with auto-recovery
- Escalates to human only when needed
- Full audit trail

## Architecture

```
.agentic file  →  [Parser]  →  AST  →  [Transformer]  →  TypeScript AST  →  .ts file
                                                                ↓
                                                         Runtime Library
                                                         (confidence, health checks)
```

## Project Structure

```
agentic-lang/
├── src/
│   ├── parser/         # Tree-sitter based parser
│   ├── transformer/    # AST → TypeScript transformation
│   ├── generator/      # Code generation + source maps
│   ├── runtime/        # Runtime library (@confidence, @needs, etc.)
│   ├── property-tests/ # Auto-generate property tests
│   └── cli.ts          # CLI entry point
├── examples/           # Example .agentic files
├── vscode-extension/   # VSCode extension for syntax highlighting
└── docs/               # Documentation

```

## Building from Source

```bash
# Install dependencies
npm install

# Build transpiler
npm run build

# Run tests
npm test

# Development mode
npm run dev -- compile examples/auth.agentic
```

## VSCode Extension

Syntax highlighting and IntelliSense support included:

```bash
cd vscode-extension
npm install
npm run compile
# Press F5 to test in Extension Development Host
```

## Documentation

- [Language Specification](docs/SPECIFICATION.md) - Full language reference
- [Type System](docs/TYPE_SYSTEM.md) - Context tracking and verification
- [Runtime Library](docs/RUNTIME.md) - Built-in functions and decorators
- [Examples](examples/) - Real-world code samples

## Design Philosophy

1. **Embrace uncertainty** - AI agents are probabilistic
2. **Incremental correctness** - Valid at every stage
3. **Context is explicit** - Dependencies declared upfront
4. **Verification by default** - Property tests auto-generate
5. **Self-healing** - Auto-recover from failures

## Research Backing

Based on comprehensive research across:
- Probabilistic programming (Pyro, RxInfer.jl)
- Gradual typing (TypeScript, Rust)
- Effect systems (Koka, Scala)
- Property-based testing (Hypothesis, fast-check)
- Self-healing systems (Kubernetes)

See [RESEARCH.md](docs/RESEARCH.md) for full references.

## Roadmap

- [x] Phase 1: TypeScript transpiler MVP
- [ ] Phase 2: VSCode extension with IntelliSense
- [ ] Phase 3: Native compiler (Rust → LLVM)
- [ ] Phase 4: Self-healing runtime
- [ ] Phase 5: Collaborative IDE features

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT License - see [LICENSE](LICENSE)

---

**Status:** MVP / Proof of Concept
**Version:** 0.1.0
**Last Updated:** January 2026