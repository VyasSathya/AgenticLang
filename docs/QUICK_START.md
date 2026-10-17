# Agentic Language - Quick Start Guide

Get started with the Agentic programming language in 5 minutes.

## Installation

```bash
# Clone or navigate to the project
cd agentic-lang

# Install dependencies
npm install

# Build the transpiler
npm run build
```

## Your First Agentic Program

Create `hello.agentic`:

```agentic
@confidence(0.95)
func greet(name: string) -> string {
    if name.isEmpty() {
        return "Hello, World!"
    }

    return "Hello, " + name + "!"
}
```

Compile it:

```bash
./bin/agentic.js compile hello.agentic
```

This generates `hello.ts`:

```typescript
import { AgenticRuntime, Result, Ok, Err } from './runtime';

function greet(name: string): string {
  if (name.isEmpty()) {
    return "Hello, World!";
  }

  return "Hello, " + name + "!";
}
```

## Using Confidence Annotations

Confidence annotations help track how sure the AI is:

```agentic
@confidence(0.95)  // Very confident
func add(a: number, b: number) -> number {
    return a + b
}

@confidence(0.60)  // Less confident - needs review
@uncertain("Multiple date formats possible")
func parseDate(input: string) -> Date {
    return Date.parse(input)
}
```

The compiler warns about low confidence:

```
⚠️  parseDate has confidence < 0.80 - consider adding tests or human review
```

## Using Result Types

Handle errors gracefully:

```agentic
@confidence(0.85)
func divide(a: number, b: number) -> Result<number, string> {
    if b == 0 {
        return Err("Cannot divide by zero")
    }

    return Ok(a / b)
}
```

Use with pattern matching:

```agentic
result = divide(10, 2) match {
    Ok(value) -> {
        // Use value
        return value * 2
    },
    Err(error) -> {
        // Handle error
        return 0
    }
}
```

## Context Requirements

Declare what your function needs:

```agentic
@needs(database: Database, config: Config)
func saveUser(user: User) -> Result<void, Error> {
    // Compiler ensures database and config are available
    database.users.save(user)
    return Ok(null)
}
```

## Property-Based Testing

Annotate functions with expected properties:

```agentic
@property("never returns negative")
@property("handles zero")
@property("is commutative")
func add(a: number, b: number) -> number {
    return a + b
}
```

Generate tests:

```bash
./bin/agentic.js compile add.agentic --property-tests
```

This creates `add.test.ts` with 1000 random test cases per property.

## Watch Mode

Automatically recompile on file changes:

```bash
./bin/agentic.js watch "examples/**/*.agentic"
```

## VSCode Integration

1. **Install the extension**
   ```bash
   cd vscode-extension
   npm install
   code .
   # Press F5 to test
   ```

2. **Open a .agentic file** - Syntax highlighting works automatically

3. **Enjoy color coding** for:
   - Annotations (`@confidence`, `@needs`, etc.)
   - Keywords (`func`, `match`, `return`)
   - Types (`Result`, `Ok`, `Err`)
   - Operators (`->`, `=>`, `|`)

## Next Steps

- Read [Language Specification](SPECIFICATION.md) for full syntax
- Explore [examples/](../examples/) for more code samples
- Check [CONTRIBUTING.md](../CONTRIBUTING.md) to contribute

## Common Issues

### Permission denied on ./bin/agentic.js

```bash
chmod +x ./bin/agentic.js
```

### Module not found errors

```bash
npm install
npm run build
```

### Syntax errors in generated TypeScript

- Check your .agentic syntax matches the specification
- Run `./bin/agentic.js compile yourfile.agentic` and review errors

## Getting Help

- GitHub Issues - Report bugs
- Discussions - Ask questions
- Examples - See working code

---

Happy coding with Agentic! 🚀
