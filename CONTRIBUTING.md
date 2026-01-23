# Contributing to Agentic

Thank you for your interest in contributing to the Agentic programming language!

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/agentic-lang.git
   cd agentic-lang
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Build the project**
   ```bash
   npm run build
   ```
5. **Run tests**
   ```bash
   npm test
   ```

## Development Workflow

### Making Changes

1. Create a new branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Test your changes
   ```bash
   npm run build
   npm test
   ./bin/agentic.js compile examples/simple.agentic
   ```

4. Commit with descriptive message
   ```bash
   git add .
   git commit -m "feat: Add support for X"
   ```

5. Push to your fork
   ```bash
   git push origin feature/your-feature-name
   ```

6. Open a Pull Request

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `test:` - Adding or updating tests
- `refactor:` - Code refactoring
- `perf:` - Performance improvement
- `chore:` - Maintenance tasks

## Project Structure

```
agentic-lang/
├── src/
│   ├── parser/           # Lexer and parser
│   ├── generator/        # Code generation
│   ├── runtime/          # Runtime library
│   ├── property-tests/   # Test generation
│   └── cli.ts            # Command-line interface
├── examples/             # Example .agentic files
├── vscode-extension/     # VSCode extension
├── docs/                 # Documentation
└── tests/                # Test suite
```

## Areas for Contribution

### High Priority
- **Parser improvements** - Better error recovery
- **Type inference** - Smarter type deduction
- **Property test generation** - More sophisticated property extraction
- **Error messages** - More helpful diagnostics

### Medium Priority
- **Standard library** - Common functions and types
- **Optimization** - Faster compilation
- **Documentation** - Tutorials and guides
- **Examples** - Real-world use cases

### Future
- **Language Server Protocol** - IDE integration
- **Native compiler** - Rust → LLVM backend
- **Formal verification** - Integration with proof assistants

## Testing

### Running Tests

```bash
npm test                  # Run all tests
npm test -- parser        # Run parser tests only
npm test -- --watch       # Watch mode
```

### Adding Tests

Place tests in `tests/` directory:

```typescript
import { describe, test, expect } from 'vitest';
import { Parser } from '../src/parser/parser';

describe('Parser', () => {
  test('parses function declaration', () => {
    const source = 'func add(a: number, b: number) -> number { return a + b }';
    const parser = new Parser();
    const ast = parser.parse(source);
    expect(ast).toBeDefined();
  });
});
```

## Code Style

- **TypeScript** with strict mode
- **2 spaces** for indentation
- **No semicolons** (except in generated code)
- **Descriptive variable names**
- **Comments** for complex logic

Format code before committing:
```bash
npm run format  # (if available)
```

## Documentation

When adding features:
1. Update `docs/SPECIFICATION.md` with formal grammar
2. Add examples to `examples/` directory
3. Update `README.md` if user-facing
4. Add JSDoc comments to public APIs

## VSCode Extension Development

```bash
cd vscode-extension
npm install
code .
# Press F5 to open Extension Development Host
```

Test your changes in the Extension Development Host before submitting.

## Reporting Issues

### Bug Reports

Include:
- Agentic version (`agentic version`)
- Input `.agentic` code
- Expected behavior
- Actual behavior
- Error messages

### Feature Requests

Include:
- Use case description
- Example syntax (if applicable)
- Why this would be valuable

## Questions?

- Open a Discussion on GitHub
- Check existing issues and PRs
- Read `docs/SPECIFICATION.md`

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Agentic! 🚀