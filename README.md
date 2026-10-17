# Agentic

A language-design and compiler prototype exploring how AI-written programs can express confidence, incomplete implementation stages, context requirements, and verification intent. The repository includes an experimental TypeScript transpiler, runtime helpers, language examples, and research notes.

## Start with the compiler source

The compiler flow in [src/cli.ts](src/cli.ts) reads an `.agentic` file, passes it through the handwritten recursive-descent [parser](src/parser/parser.ts), and emits TypeScript through the [generator](src/generator/typescript-generator.ts).

Install the declared Node.js dependencies, then try the source CLI:

```sh
npm install
npm run dev -- compile examples/minimal.agentic --output examples/minimal.ts
```

The equivalent build path is:

```sh
npm run build
node dist/cli.js compile examples/minimal.agentic --output examples/minimal.ts
```

The package also declares `npm test` using Vitest. Build, test, and example execution results have not been validated as part of this documentation review.

**Entry-point distinction:** [bin/agentic.js](bin/agentic.js), the package-facing CLI, currently provides learning/example commands and a placeholder `compile` action. It does not perform the source compiler's transformation. Use the source or built `src/cli.ts` route above when evaluating compilation.

## Syntax to explore

The examples use function declarations, type annotations, result values, and metadata such as confidence and development stages:

```agentic
@confidence(0.95)
@complete
func greet(name: string) -> string {
    return "Hello, " + name
}
```

See [examples/](examples/) for the language's intended usage and [docs/SPECIFICATION.md](docs/SPECIFICATION.md) for its design. Example presence is not a guarantee that every syntax form or verification feature is supported by the current compiler.

## Repository map

| Area | Source | Role |
| --- | --- | --- |
| Compiler CLI | [src/cli.ts](src/cli.ts) | Compile, watch, and version commands |
| Lexing and parsing | [src/parser/](src/parser/) | Tokenization, AST construction, and an enhanced-parser experiment |
| TypeScript generation | [src/generator/](src/generator/) | Generated code and source-map support |
| Runtime | [src/runtime/](src/runtime/) | Result helpers, confidence tracking, and agent experiments |
| Verification experiments | [src/verification/](src/verification/), [src/lean4/](src/lean4/) | Z3 integration and Lean export source |
| Language tooling | [src/lsp/](src/lsp/), [vscode-extension/](vscode-extension/) | Language-server and editor-extension source |
| Further experiments | [src/effects/](src/effects/), [src/refinements/](src/refinements/), [src/property-tests/](src/property-tests/) | Effects, refinement types, and generated-test exploration |

The separate [src/wasm/](src/wasm/) Rust experiment is outside the root TypeScript build configuration.

## Documentation

- [Quick start](docs/QUICK_START.md)
- [Language specification](docs/SPECIFICATION.md)
- [Tutorials](docs/tutorials/)
- [Cookbook](docs/cookbook/README.md)
- [Research references](docs/RESEARCH.md)
- [Runtime source](src/runtime/index.ts)

For the VS Code extension's declared compile workflow, see its [README](vscode-extension/README.md) and [package manifest](vscode-extension/package.json).

## Prototype status

This is an experimental implementation with parallel compiler/tooling paths. Formal verification, self-healing, complete context checking, and automatic property testing should be treated as design and implementation experiments rather than release guarantees. The source CLI currently returns an empty diagnostic list, and generated files import `./runtime`; consumers need to review and provide the matching runtime layout before executing generated code.

A reproducible end-to-end example, supported grammar matrix, and recorded build/test results are useful next milestones. No benchmark numbers or working deployment are claimed here.

## License

The repository includes the [MIT License](LICENSE). Preserve its copyright and permission notice when reusing the source.
