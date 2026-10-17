# Agentic Language Specification

Version 0.1.0

## Overview

Agentic is an AI-native programming language that treats uncertainty, incremental development, and verification as first-class language features.

## Language Features

### 1. Confidence Annotations

Declare confidence levels for functions and code blocks:

```agentic
@confidence(0.95)  // Very confident
func add(a: number, b: number) -> number {
    return a + b
}

@confidence(0.60)  // Not sure - needs review
@uncertain("Multiple date formats possible")
func parseDate(input: string) -> Date {
    return Date.parse(input, format="??")
}
```

**Semantics:**
- Confidence is a float between 0.0 and 1.0
- Values < 0.80 trigger compiler warnings
- `@uncertain` provides explanation for low confidence

### 2. Incremental Stages

Code validity at every development stage:

```agentic
// Stage 1: Stub
@stub("Not implemented yet")
func authenticate(token: string) -> Result<User, AuthError> {
    // Returns error at runtime
}

// Stage 2: Partial
@partial("Only handles happy path")
func authenticate(token: string) -> Result<User, AuthError> {
    decoded = jwt.decode(token)
    return Ok(User.fromDict(decoded))
}

// Stage 3: Complete
@complete
@verified_by(property_tests: ["valid_token", "invalid_token"])
func authenticate(token: string) -> Result<User, AuthError> {
    if token.isEmpty() { return Err(AuthError.MISSING_TOKEN) }
    // Full implementation
}
```

**Semantics:**
- `@stub` - Function exists but not implemented (throws at runtime)
- `@partial` - Works for subset of inputs (documented in annotation)
- `@complete` - Full implementation with verification

### 3. Context Requirements

Explicit dependency declaration:

```agentic
@needs(database: Database, logger: Logger, jwt_secret: string)
func processUser(userId: string) {
    user = database.users.find(userId)
    logger.info("Processing user: {userId}")
}
```

**Semantics:**
- Compiler checks context availability at call sites
- Missing context generates compile-time error
- Context can be validated at runtime

### 4. Rich Error Handling

Errors with structured recovery information:

```agentic
decoded = jwt.decode(token, jwt_secret) or error {
    @context {
        what_failed: "JWT decode",
        current_state: {token: token, decoded: null},
        likely_cause: "Token format invalid",
        suggestions: [
            "Check token format",
            "Verify JWT_SECRET"
        ],
        recovery: {
            action: "fix_and_retry",
            command: "curl -X POST /auth/refresh"
        }
    }
    return Err(AuthError.INVALID_TOKEN)
}
```

**Semantics:**
- `or error { }` block executes on failure
- `@context` provides structured metadata
- Suggestions and recovery steps are machine-readable

### 5. Match Expressions

Pattern matching on Result types:

```agentic
decoded = jwt.decode(token) match {
    Ok(payload) -> payload,
    Err(e) -> {
        // Handle error
        return Err(AuthError.INVALID_TOKEN)
    }
}
```

**Semantics:**
- Exhaustive matching required
- Bindings (`payload`, `e`) are typed
- Arrow syntax `->` for single expression, `{}` for block

### 6. Type System

#### Primitives
- `string`, `number`, `boolean`, `void`, `null`

#### Result Type
```agentic
Result<T, E>  // Either Ok(T) or Err(E)

// Usage
func divide(a: number, b: number) -> Result<number, string> {
    if b == 0 {
        return Err("Division by zero")
    }
    return Ok(a / b)
}
```

#### Union Types
```agentic
type Status = "pending" | "active" | "completed"
```

### 7. Property-Based Testing

Auto-generated tests from annotations:

```agentic
@property("rejects empty tokens")
@property("rejects expired tokens")
@property("accepts valid tokens")
func authenticate(token: string) -> Result<User, AuthError> {
    // Implementation
}
```

**Semantics:**
- Properties generate 1000 random test cases each
- Shrinking to minimal failing case
- Runs with fast-check framework

### 8. Self-Healing Runtime

Health checks with auto-recovery:

```agentic
@healthcheck(interval: 30s)
func checkDatabase() -> HealthStatus {
    try {
        db.ping()
        return HealthStatus.OK
    } catch {
        return HealthStatus.FAILED
    }
}

@recovery(for: checkDatabase)
func healDatabase() {
    db.reconnect()
}
```

**Semantics:**
- Health checks run at specified intervals
- Recovery function called on failure
- Escalates to human after 3 failed attempts

## Compilation Model

### Transpilation to TypeScript

Agentic compiles to TypeScript with runtime library:

```
.agentic → [Parser] → AST → [Transformer] → TypeScript AST → .ts
```

### Runtime Support

Generated code links to `@agentic/runtime`:

```typescript
import { AgenticRuntime, Result, Ok, Err } from '@agentic/runtime';
```

### Source Maps

Full debugging support with source maps:

```bash
agentic compile auth.agentic --source-map
```

## Formal Grammar

```
program         ::= statement*
statement       ::= function_decl | variable_decl | if_stmt | return_stmt | expression
function_decl   ::= annotation* "func" IDENT "(" param_list ")" "->" type block
param_list      ::= (IDENT ":" type ("," IDENT ":" type)*)?
type            ::= IDENT | "Result" "<" type "," type ">"  | type "|" type
block           ::= "{" statement* "}"
if_stmt         ::= "if" expression block ("else" (block | if_stmt))?
return_stmt     ::= "return" expression?
expression      ::= binary_expr | call_expr | match_expr | primary
binary_expr     ::= expression OPERATOR expression
call_expr       ::= IDENT "(" arg_list ")"
match_expr      ::= expression "match" "{" match_case+ "}"
match_case      ::= pattern "->" (expression | block)
pattern         ::= "Ok" "(" IDENT ")" | "Err" "(" IDENT ")" | "_"
primary         ::= NUMBER | STRING | BOOLEAN | NULL | IDENT
annotation      ::= "@" IDENT ("(" annotation_args ")")?
```

## Standard Library

### Core Types
- `Result<T, E>` - Success or failure type
- `Ok<T>` - Success constructor
- `Err<E>` - Error constructor
- `HealthStatus` - Health check status enum

### Runtime API
- `AgenticRuntime.confidence` - Confidence tracker
- `AgenticRuntime.context` - Context validator
- `AgenticRuntime.health` - Health check monitor

## Tooling

### CLI
```bash
agentic compile <input>           # Compile to TypeScript
agentic watch <pattern>            # Watch mode
agentic version                    # Show version
```

### VSCode Extension
- Syntax highlighting
- Auto-completion
- Code folding
- Bracket matching

## Examples

See `examples/` directory for complete examples:
- `auth.agentic` - Authentication with confidence tracking
- `simple.agentic` - Basic syntax demonstration

## Future Features (Roadmap)

- Native compiler (Rust → LLVM)
- Language Server Protocol (LSP) for IDE support
- Debug Adapter Protocol (DAP) for debugging
- WASM compilation target
- Formal verification integration