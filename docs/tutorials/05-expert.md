# Tutorial 5: Expert - Contributing to Agentic

**Level:** Expert
**Time:** 3+ hours
**Prerequisites:** [Tutorial 4: Advanced](./04-advanced.md)

## What You'll Learn

- Agentic compiler internals
- Extending the type system
- Adding new annotations
- Writing compiler plugins
- LSP feature development
- Contributing to the project

## Compiler Architecture

### Compilation Pipeline

```
Source (.agentic)
    ↓
Lexer (tokenization)
    ↓
Parser (AST generation)
    ↓
Semantic Analysis (type checking, effect inference)
    ↓
Verification (Z3, property tests)
    ↓
Code Generation (TypeScript)
    ↓
Runtime Linking (@agentic/runtime)
    ↓
Output (.ts)
```

### Key Files

- **[src/parser/lexer.ts](../../src/parser/lexer.ts)** - Tokenization
- **[src/parser/parser.ts](../../src/parser/parser.ts)** - Recursive descent parser
- **[src/types.ts](../../src/types.ts)** - AST definitions
- **[src/generator/typescript-generator.ts](../../src/generator/typescript-generator.ts)** - Code generation
- **[src/runtime/index.ts](../../src/runtime/index.ts)** - Runtime library

## Extending the Type System

### Adding a New Type

**Step 1:** Define the AST node in `src/types.ts`:

```typescript
export interface RefinementType extends BaseNode {
  type: 'RefinementType';
  baseType: TypeAnnotation;
  predicate: string;
  variable: string;
}
```

**Step 2:** Update the parser in `src/parser/parser.ts`:

```typescript
private parseTypeAnnotation(): AST.TypeAnnotation {
  // Existing type parsing...

  // Add refinement type syntax: number{x | x > 0}
  if (this.match(TokenType.LBRACE)) {
    const variable = this.consume(TokenType.IDENTIFIER).value;
    this.consume(TokenType.PIPE);
    const predicate = this.parseExpression();
    this.consume(TokenType.RBRACE);

    return {
      kind: 'refinement',
      baseType: baseType,
      predicate: predicate,
      variable: variable
    };
  }
}
```

**Step 3:** Update code generator in `src/generator/typescript-generator.ts`:

```typescript
private generateTypeAnnotation(type: AST.TypeAnnotation): string {
  if (type.kind === 'refinement') {
    // Generate runtime validation
    return `RefineType<${this.generateTypeAnnotation(type.baseType)}, "${type.predicate}">`;
  }
}
```

**Step 4:** Add runtime support in `src/runtime/index.ts`:

```typescript
export function RefineType<T>(
  value: T,
  predicate: (v: T) => boolean,
  errorMessage: string
): T {
  if (!predicate(value)) {
    throw new RefinementViolation(errorMessage, value);
  }
  return value;
}
```

## Adding New Annotations

### Creating a Custom Annotation

**Example:** Add `@memoize` for function caching

**Step 1:** Define annotation in `src/types.ts`:

```typescript
// Already exists - annotations are generic!
export interface Annotation {
  name: string;  // "memoize"
  args: Record<string, any>;  // { ttl: 60, maxSize: 100 }
  loc?: SourceRange;
}
```

**Step 2:** Parse in `src/parser/parser.ts`:

```typescript
private parseAnnotation(): AST.Annotation {
  this.consume(TokenType.AT);
  const name = this.consume(TokenType.IDENTIFIER).value;

  let args: Record<string, any> = {};

  if (this.match(TokenType.LPAREN)) {
    args = this.parseAnnotationArgs();
    this.consume(TokenType.RPAREN);
  }

  return { name, args };
}
```

**Step 3:** Handle in code generator:

```typescript
private generateFunctionDeclaration(node: AST.FunctionDeclaration): string {
  const memoizeAnnotation = node.annotations.find(a => a.name === 'memoize');

  if (memoizeAnnotation) {
    // Wrap function with memoization
    return `const ${node.name} = memoize(
      function ${node.name}_impl(...) { ... },
      { ttl: ${memoizeAnnotation.args.ttl || 60} }
    );`;
  }
}
```

**Step 4:** Implement runtime in `src/runtime/memoize.ts`:

```typescript
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: { ttl: number; maxSize: number }
): T {
  const cache = new Map();

  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < options.ttl * 1000) {
      return cached.value;
    }

    const value = fn(...args);
    cache.set(key, { value, timestamp: Date.now() });

    // Evict old entries if cache too large
    if (cache.size > options.maxSize) {
      const oldest = Array.from(cache.keys())[0];
      cache.delete(oldest);
    }

    return value;
  }) as T;
}
```

## Writing Compiler Plugins

### Plugin API

```typescript
// src/plugins/plugin-api.ts
export interface AgenticPlugin {
  name: string;
  version: string;

  // Lifecycle hooks
  beforeParse?(source: string): string;
  afterParse?(ast: AST.ASTNode[]): AST.ASTNode[];
  beforeGenerate?(ast: AST.ASTNode[]): AST.ASTNode[];
  afterGenerate?(code: string): string;

  // Custom transformations
  transform?(node: AST.ASTNode): AST.ASTNode;
}
```

### Example Plugin: Auto-Property Generator

```typescript
// plugins/auto-property-generator.ts
export const autoPropertyPlugin: AgenticPlugin = {
  name: 'auto-property-generator',
  version: '1.0.0',

  afterParse(ast: AST.ASTNode[]): AST.ASTNode[] {
    for (const node of ast) {
      if (node.type === 'FunctionDeclaration') {
        const func = node as AST.FunctionDeclaration;

        // Auto-add properties based on function name
        if (func.name.startsWith('is') || func.name.startsWith('has')) {
          func.annotations.push({
            name: 'property',
            args: { description: 'returns boolean' }
          });
        }
      }
    }
    return ast;
  }
};
```

## LSP Feature Development

### Adding Hover Information

```typescript
// src/lsp/features/hover.ts
connection.onHover(
  (params: HoverParams): Hover | null => {
    const document = documents.get(params.textDocument.uri);
    const position = params.position;

    // Find symbol at position
    const symbol = findSymbolAt(document, position);

    if (!symbol) return null;

    // Generate hover content
    const markdown = generateHoverMarkdown(symbol);

    return {
      contents: {
        kind: 'markdown',
        value: markdown
      }
    };
  }
);

function generateHoverMarkdown(symbol: Symbol): string {
  let md = `**${symbol.kind}** \`${symbol.name}\`\n\n`;

  if (symbol.kind === 'function') {
    md += `\`\`\`agentic\n${symbol.signature}\n\`\`\`\n\n`;

    // Add confidence info
    if (symbol.confidence) {
      md += `**Confidence:** ${symbol.confidence} `;
      if (symbol.confidence < 0.80) {
        md += '⚠️ (below threshold)\n\n';
      } else {
        md += '✓\n\n';
      }
    }

    // Add property tests info
    if (symbol.properties && symbol.properties.length > 0) {
      md += `**Properties:**\n`;
      symbol.properties.forEach(p => {
        md += `- ${p.description}\n`;
      });
    }
  }

  return md;
}
```

### Adding Code Actions

```typescript
// src/lsp/features/code-actions.ts
connection.onCodeAction(
  (params: CodeActionParams): CodeAction[] => {
    const actions: CodeAction[] = [];

    // Suggest adding @confidence if missing
    if (isFunctionWithoutConfidence(params)) {
      actions.push({
        title: 'Add @confidence annotation',
        kind: CodeActionKind.QuickFix,
        edit: {
          changes: {
            [params.textDocument.uri]: [{
              range: params.range,
              newText: '@confidence(0.80)\n'
            }]
          }
        }
      });
    }

    // Suggest upgrading @stub to @partial
    if (isSt ubFunction(params)) {
      actions.push({
        title: 'Upgrade to @partial',
        kind: CodeActionKind.Refactor,
        command: {
          command: 'agentic.upgradeToPartial',
          arguments: [params.textDocument.uri, params.range]
        }
      });
    }

    return actions;
  }
);
```

## Contributing to Agentic

### Setting Up Development Environment

```bash
# Clone repository
git clone https://github.com/agentic-lang/agentic.git
cd agentic

# Install dependencies
npm install

# Build compiler
npm run build

# Run tests
npm test

# Run in development mode
npm run dev -- compile examples/auth.agentic
```

### Contribution Workflow

1. **Find an issue** or propose a feature
   - Check [GitHub Issues](https://github.com/agentic-lang/agentic/issues)
   - Look for "good first issue" label
   - Propose in [GitHub Discussions](https://github.com/agentic-lang/agentic/discussions)

2. **Create a branch**
   ```bash
   git checkout -b feature/my-awesome-feature
   ```

3. **Implement your changes**
   - Write code
   - Add tests (property tests + unit tests)
   - Update documentation
   - Run full test suite

4. **Verify quality**
   ```bash
   npm run lint
   npm run test
   npm run test:mutation
   npm run build
   ```

5. **Submit pull request**
   - Clear description
   - Link to issue/discussion
   - Include tests and docs
   - Wait for review

### Code Style Guidelines

```agentic
// ✓ Good: Clear confidence, complete properties
@confidence(0.95)
@complete
@property("handles edge cases")
@property("never returns null")
func goodExample(x: number) -> Result<number, Error> {
  if x < 0 {
    return Err(Error.NEGATIVE_INPUT)
  }
  return Ok(x * 2)
}

// ✗ Bad: No confidence, missing error handling
func badExample(x) {
  return x * 2  // What if x is null? What if it's not a number?
}
```

### Testing Your Changes

```typescript
// tests/my-feature.test.ts
import { describe, it, expect } from 'vitest';
import { Parser } from '../src/parser/parser';

describe('My Awesome Feature', () => {
  it('should parse new syntax correctly', () => {
    const source = '@mynew annotation\nfunc test() {}';
    const parser = new Parser();
    const ast = parser.parse(source);

    expect(ast[0].annotations).toContainEqual(
      expect.objectContaining({ name: 'mynewannotation' })
    );
  });

  // Property-based test
  it.prop([fc.string()])('should handle all strings', (input) => {
    const result = myFeature(input);
    expect(result).toBeDefined();
  }, { numRuns: 1000 });
});
```

## Advanced Research Topics

### Implementing Dependent Types

Read the research on dependent types and implement basic support:

```agentic
// Length-indexed vectors
type Vec<T, n: nat> = ...

@verify(solver: "z3")
@requires(n > 0)
func head<T, n: nat>(vec: Vec<T, n + 1>) -> T {
  // Type system guarantees vec has at least 1 element
  return vec[0]  // Safe - no runtime check needed
}
```

### Probabilistic Programming Integration

Integrate with probabilistic programming frameworks:

```agentic
@probabilistic_model
@confidence(0.92)
func bayesianInference(observations: Data[]) -> Distribution<Parameter> {
  // Use Turing.jl or Pyro backend
  // Return probability distribution over parameters
}
```

### Gradual Verification

Implement gradual refinement types:

```agentic
// Stage 1: Dynamic (runtime checking only)
type UserId = string

// Stage 2: Refined (static + runtime)
type UserId = string{s | s.length == 36}  // UUID format

// Stage 3: Dependent (full dependent type)
type UserId = string{s | isValidUUID(s)}
```

## Publishing Your Work

### Writing an RFC

For major changes, submit an RFC (Request for Comments):

```markdown
# RFC: Add Dependent Types to Agentic

## Summary
Implement basic dependent types where types can depend on values.

## Motivation
Enables compile-time verification of array bounds, string lengths, etc.

## Detailed Design
### Syntax
\`\`\`agentic
type Vec<T, n: nat> = ...
\`\`\`

### Type Checking
...

### Code Generation
...

## Drawbacks
- Increased compilation time
- More complex type checker
- Learning curve for users

## Alternatives
- Refinement types only (simpler)
- Runtime validation only

## Unresolved Questions
- How to handle type inference?
- Performance impact?
```

Submit to [GitHub Discussions: RFCs](https://github.com/agentic-lang/agentic/discussions/categories/rfcs)

### Publishing a Package

Create and publish an Agentic package:

```bash
# Create package
mkdir agentic-http-client
cd agentic-http-client

# Initialize
agentic init

# Write code in src/
cat > src/client.agentic << EOF
@module("http-client")
@confidence(0.95)
func get(url: string) -> Promise<Result<Response, Error>> {
  // Implementation
}
EOF

# Build
agentic build

# Test
agentic test

# Publish
agentic publish
```

### Writing Blog Posts

Share your Agentic experience:

**Topics:**
- "How I Built [X] with Agentic"
- "Migrating from [Language] to Agentic"
- "Formal Verification in Practice"
- "Multi-Agent Systems with Agentic"

**Publish on:**
- [Agentic Blog](https://blog.agentic-lang.org)
- Dev.to
- Medium
- Your personal blog

## Research Opportunities

### Academic Papers

Potential research topics using Agentic:

1. **"Verified Confidence: Statistical Validation of AI-Generated Code"**
   - Venue: PLDI 2027
   - Contribution: Mutation-confidence correlation

2. **"Session Types for Multi-Agent Coordination"**
   - Venue: ICSE 2027
   - Contribution: A2A protocol verification

3. **"Effect Systems for AI Workloads"**
   - Venue: OOPSLA 2027
   - Contribution: llm_call, cost tracking effects

4. **"Incremental Correctness: Type Systems for Progressive Development"**
   - Venue: POPL 2027
   - Contribution: @stub → @partial → @complete formalization

### Getting Involved in Research

1. **Join research working group**
   - Monthly meetings
   - Collaborate with academics
   - Co-author papers

2. **Apply for grants**
   - Use Agentic in your research
   - NSF SBIR, Mozilla MOSS
   - University research funding

3. **Organize workshops**
   - "Formal Methods for AI Code" workshop
   - Host at conferences (PLDI, ICSE, etc.)

## Advanced Examples

### Implementing a New Standard Library Module

Create `@agentic/websocket`:

```agentic
// stdlib/websocket/client.agentic
@module("websocket")
@confidence(0.89)

@effects(network, async, state)
type WebSocket {
  url: string
  readyState: "connecting" | "open" | "closing" | "closed"

  @confidence(0.93)
  @property("establishes connection")
  @property("handles connection errors")
  func connect(self) -> Promise<Result<void, WsError>>

  @confidence(0.95)
  @property("sends data when connected")
  @property("queues data when connecting")
  func send(self, data: string) -> Result<void, WsError>

  @confidence(0.94)
  func onMessage(self, handler: (data: string) -> void) -> void

  @confidence(0.96)
  func close(self, code: number = 1000) -> void
}
```

### Building a Compiler Plugin

```typescript
// plugins/optimize-confidence.ts
export const optimizeConfidencePlugin: AgenticPlugin = {
  name: 'optimize-confidence',
  version: '1.0.0',

  afterParse(ast: AST.ASTNode[]): AST.ASTNode[] {
    // Remove confidence tracking in production builds
    if (process.env.NODE_ENV === 'production') {
      for (const node of ast) {
        if (node.type === 'FunctionDeclaration') {
          // Strip confidence annotations for zero runtime cost
          node.annotations = node.annotations.filter(
            a => a.name !== 'confidence'
          );
        }
      }
    }
    return ast;
  }
};
```

## Performance Optimization

### Profiling the Compiler

```typescript
// benchmark/compiler-profile.ts
import { performance } from 'perf_hooks';

function profileCompilation(source: string) {
  const start = performance.now();

  // Lex
  const lexStart = performance.now();
  const tokens = lexer.tokenize(source);
  const lexTime = performance.now() - lexStart;

  // Parse
  const parseStart = performance.now();
  const ast = parser.parse(tokens);
  const parseTime = performance.now() - parseStart;

  // Generate
  const genStart = performance.now();
  const code = generator.generate(ast);
  const genTime = performance.now() - genStart;

  const total = performance.now() - start;

  return {
    total,
    lex: lexTime,
    parse: parseTime,
    generate: genTime,
    percentages: {
      lex: (lexTime / total) * 100,
      parse: (parseTime / total) * 100,
      generate: (genTime / total) * 100
    }
  };
}
```

## Key Takeaways

- ✅ Understand compiler architecture (lexer → parser → generator)
- ✅ Extend type system by adding AST nodes
- ✅ Create custom annotations for new features
- ✅ Write compiler plugins for transformations
- ✅ Develop LSP features for IDE support
- ✅ Follow RFC process for major changes
- ✅ Publish packages and blog posts
- ✅ Contribute to research and academic papers

## Next Steps

**Congratulations!** You've mastered Agentic. Now:

- **Contribute to core** - Join the core team
- **Build packages** - Create ecosystem libraries
- **Publish research** - Write papers using Agentic
- **Give talks** - Speak at conferences
- **Mentor others** - Help newcomers learn
- **Shape the future** - Participate in RFCs

## Resources

- [Compiler Development Guide](../guides/compiler-development.md)
- [LSP Development Guide](../guides/lsp-development.md)
- [Plugin API Documentation](../api/plugins.md)
- [RFC Process](../contributing/rfc-process.md)

## Get Involved

- **Core Team:** Apply at [team@agentic-lang.org](mailto:team@agentic-lang.org)
- **Research Group:** Join monthly meetings
- **Discord #core-dev:** Daily discussions
- **GitHub:** [github.com/agentic-lang/agentic](https://github.com/agentic-lang/agentic)

---

**Previous:** [← Advanced](./04-advanced.md)

**You've completed the full Agentic tutorial series!** 🎉

**Welcome to the core community!** 💚
