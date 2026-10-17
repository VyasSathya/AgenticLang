# Agentic Language Refinement Plan

## Status: In Progress

## Completed ✅

1. Created enhanced parser methods for:
   - Match expressions (`expr match { Ok(x) -> ..., Err(e) -> ... }`)
   - Error recovery blocks (`expr or error { @context {...} return ... }`)
   - Better annotation argument parsing
   - Context value parsing (objects, arrays, primitives)

Files created:
- `src/parser/parser-enhanced.ts` - Enhanced parser functions
- `scripts/build.js` - Cross-platform build script

## Pending Approval 🔒

**package.json changes needed:**

```json
{
  "scripts": {
    "build": "node scripts/build.js",
    "watch": "tsc --watch",
    "test": "vitest",
    "dev": "ts-node src/cli.ts",
    "example": "npm run build && node bin/agentic.js compile examples/auth.agentic --output examples/auth.ts"
  }
}
```

**Changes:**
- `build`: Use cross-platform Node script instead of `tsc && chmod`
- `example`: Use `node bin/agentic.js` instead of `./bin/agentic.js`

## Next Steps 🚀

### Phase 1: Core Functionality (High Priority)

1. **Integrate enhanced parser** ⏱️ 15 min
   - Merge parser-enhanced.ts into parser.ts
   - Test match expression parsing
   - Test error recovery parsing
   
2. **Implement code generation for match/error recovery** ⏱️ 30 min
   - Add `generateMatchExpression` to typescript-generator.ts
   - Add `generateErrorRecovery` to typescript-generator.ts
   - Handle Result type properly
   
3. **Enhance annotation handling** ⏱️ 20 min
   - Integrate enhanced annotation parsing
   - Pass parsed args to runtime
   - Add confidence threshold warnings

4. **Add stage system** ⏱️ 25 min
   - @stub generates runtime error
   - @partial generates warning comment
   - @complete passes silently
   
5. **Fix and test build** ⏱️ 10 min
   - Get package.json approval
   - Run build
   - Test generated code

### Phase 2: Code Generation (Medium Priority)

6. **Complete TypeScript generation** ⏱️ 45 min
   - Proper Result type handling
   - Try-catch for error recovery
   - Switch statement for match expressions
   - Source map improvements

7. **Runtime enhancements** ⏱️ 30 min
   - Better Result methods (map, flatMap, unwrap)
   - Confidence tracking at runtime
   - Context validation
   - Health check improvements

### Phase 3: Testing (Medium Priority)

8. **Expand test suite** ⏱️ 60 min
   - Parser tests for new features
   - Codegen tests
   - End-to-end compilation tests
   - Property test integration

9. **Create advanced examples** ⏱️ 45 min
   - Match expression example
   - Error recovery example
   - Complex auth flow
   - API server example

### Phase 4: Tooling (Lower Priority)

10. **VSCode extension improvements** ⏱️ 2 hours
    - Add LSP client
    - Implement diagnostics
    - Add code snippets
    - Improve syntax highlighting

11. **CLI enhancements** ⏱️ 1 hour
    - Init command
    - Better error messages
    - Config file support
    - Progress indicators

### Phase 5: Advanced Features (Future)

12. **Semantic analyzer** ⏱️ 3 hours
    - Type checking
    - Undefined variable detection
    - Exhaustiveness checking
    - Dead code detection

13. **Property test generator** ⏱️ 2 hours
    - Generate fast-check tests
    - Wire into vitest
    - Add mutation testing

14. **Standard library** ⏱️ 4 hours
    - Array utilities
    - String utilities
    - Async helpers
    - Validation functions

15. **LSP server** ⏱️ 8 hours
    - Full language server
    - Autocomplete
    - Go-to-definition
    - Refactoring support

## Estimated Total Time

- **Phase 1 (Core)**: ~2 hours - CRITICAL
- **Phase 2 (Codegen)**: ~1.5 hours - HIGH
- **Phase 3 (Testing)**: ~2 hours - HIGH
- **Phase 4 (Tooling)**: ~3 hours - MEDIUM
- **Phase 5 (Advanced)**: ~17+ hours - FUTURE

**MVP Completion**: Phases 1-3 = ~5.5 hours

## Testing Strategy

After each phase:
1. Run `npm run build`
2. Compile all examples
3. Verify generated TypeScript is valid
4. Run test suite
5. Manual smoke test

## Success Criteria

- [x] Phase 1: All examples compile without errors
- [ ] Phase 2: Generated code passes TypeScript strict mode
- [ ] Phase 3: 80%+ test coverage
- [ ] Phase 4: VSCode extension provides basic IDE features
- [ ] Phase 5: Full production-ready language with tooling

## Notes

- **Windows compatibility**: All scripts now Node-based (no bash/chmod)
- **Incremental approach**: Each step is independently testable
- **No breaking changes**: Existing features continue to work
- **Documentation**: Update docs as features are completed

## Quick Win Checklist

These can be done immediately:

- [x] Create cross-platform build script
- [x] Document package.json changes
- [ ] Get package.json approval and fix build
- [ ] Merge enhanced parser functions
- [ ] Add basic match expression codegen
- [ ] Test minimal example compilation
- [ ] Add one comprehensive example

**Target: Working match expressions and error recovery within 1 hour**
