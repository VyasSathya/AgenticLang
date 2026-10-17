# Agentic Language - 60 Second Quickstart

## Install (One Command)
```bash
npm install -g agentic-lang
```

## Your First Agentic Program (30 seconds)

Create `hello.agentic`:
```agentic
@confidence(0.95, "Simple greeting")
@complete
func greet(name: string) -> string {
  return "Hello, " + name + "!"
}

@confidence(0.90, "Basic math")
@complete
func divide(a: number, b: number) -> Result<number, string> {
  if b == 0 {
    return Err("Cannot divide by zero")
  }
  return Ok(a / b)
}

// Use pattern matching
@complete
func safeDivide(a: number, b: number) -> string {
  divide(a, b) match {
    Ok(result) -> return "Result: " + result,
    Err(error) -> return "Error: " + error
  }
}
```

## Compile & Run
```bash
agentic compile hello.agentic --output hello.ts
node hello.ts
```

## For AI Agents: The 5 Key Features

### 1. **Confidence Tracking** - Tell humans how sure you are
```agentic
@confidence(0.60, "Untested edge cases")
func experimentalFeature() {
  // Your code here
}
```

### 2. **Incremental Development** - Ship incomplete code safely
```agentic
@stub  // Compiles but throws at runtime
func notDoneYet() { }

@partial  // Works for basic cases
func partiallyDone() { }

@complete  // Production ready
func fullyDone() { }
```

### 3. **Rich Error Context** - Machine-readable recovery
```agentic
result = apiCall() or error {
  @context {
    what_failed: "API call",
    suggestions: ["Check network", "Retry with backoff"],
    recovery: { action: "use_cache" }
  }
  return useCachedData()
}
```

### 4. **Explicit Dependencies** - No undefined variables
```agentic
@needs(database, api_key, logger)
func processUser(id: string) {
  // Compiler ensures database, api_key, logger exist
}
```

### 5. **Pattern Matching** - Elegant error handling
```agentic
fetchUser(id) match {
  Ok(user) -> return user,
  Err(e) -> return defaultUser
}
```

## Result Type (Rust-inspired)

```agentic
// Functions return Result<Success, Error>
func authenticate(token: string) -> Result<User, AuthError> {
  if !token {
    return Err(AuthError.MISSING_TOKEN)
  }
  return Ok(user)
}

// Pattern match on results
authenticate(token) match {
  Ok(user) -> login(user),
  Err(e) -> showError(e)
}
```

## Runtime Utilities

The Agentic runtime provides powerful helpers:

```typescript
// Available automatically in generated code:
import {
  Ok, Err,           // Result constructors
  unwrap,            // Extract value or throw
  unwrapOr,          // Extract or use default
  map,               // Transform Ok value
  andThen,           // Chain operations
  retry,             // Auto-retry with backoff
  fallbackChain,     // Try multiple strategies
  validate           // Predicate validation
} from 'agentic/runtime'
```

## Real-World Example

```agentic
@confidence(0.88, "Production tested")
@needs(database, jwt_secret)
@complete
func authenticate(token: string) -> Result<User, AuthError> {
  // Decode JWT with error recovery
  decoded = jwt.decode(token, jwt_secret) or error {
    @context {
      what_failed: "JWT decode",
      likely_cause: "Invalid token format",
      suggestions: ["Check token format", "Verify secret"],
      recovery: { action: "try_refresh_token" }
    }
    return Err(AuthError.INVALID_TOKEN)
  }

  // Check expiration
  if decoded.exp < now() {
    return Err(AuthError.EXPIRED)
  }

  // Fetch user with pattern matching
  database.findUser(decoded.userId) match {
    Ok(user) -> return Ok(user),
    Err(e) -> return Err(AuthError.USER_NOT_FOUND)
  }
}
```

## Next Steps

1. **Try the examples**: `cd examples && agentic compile showcase.agentic`
2. **Read the docs**: [Full specification](docs/SPECIFICATION.md)
3. **Join the community**: [Discord](https://discord.gg/agentic) (coming soon)
4. **IDE support**: Install VSCode extension for syntax highlighting

## Why Agentic?

Built specifically for AI agents to write reliable, self-documenting code:
- ✅ **Uncertainty as a type** - Confidence is tracked, not assumed
- ✅ **Incremental correctness** - Ship @stub → @partial → @complete
- ✅ **Self-healing** - Structured error recovery with executable suggestions
- ✅ **Auto-verified** - Property-based tests generated from annotations
- ✅ **Human oversight** - Low-confidence code flagged for review

## Cheat Sheet

| Feature | Syntax | Purpose |
|---------|--------|---------|
| Confidence | `@confidence(0.90, "reason")` | Track certainty |
| Stage | `@stub` / `@partial` / `@complete` | Track progress |
| Dependencies | `@needs(db, api_key)` | Declare requirements |
| Uncertain | `@uncertain("edge cases")` | Flag risky code |
| Pattern match | `x match { Ok(v) -> v }` | Handle Results |
| Error recovery | `call() or error { }` | Structured errors |
| Result type | `Result<T, E>` | Success or failure |

## Tips for AI Agents

1. **Start with @stub** - Get it compiling first
2. **Add @confidence** - Grade your own work
3. **Use @needs** - Prevent undefined variable bugs
4. **Mark @uncertain** - Flag areas needing human review
5. **Pattern match** - Handle errors explicitly
6. **Add @property** - Auto-generate tests (coming soon)

## Philosophy

Agentic recognizes that **AI code is probabilistic, not deterministic**:
- Traditional languages: "Either it works or it's broken"
- Agentic: "It works with 85% confidence, here's what might fail"

This is the first language where **uncertainty is a feature, not a bug**.

---

**Ready to build?** Start with the examples and experiment! 🚀
