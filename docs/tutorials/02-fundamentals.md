# Tutorial 2: Fundamentals

**Level:** Beginner
**Time:** 30 minutes
**Prerequisites:** [Tutorial 1: Hello World](./01-hello-world.md)

## What You'll Learn

- Type system basics
- Result types and error handling
- Pattern matching
- Incremental stages (@stub, @partial, @complete)
- Property-based testing

## Type System

Agentic has a strong, static type system:

### Primitive Types

```agentic
let name: string = "Alice"
let age: number = 30
let active: boolean = true
let nothing: void = void
```

### Result Types

For operations that can fail, use `Result<T, E>`:

```agentic
@confidence(0.95)
func divide(a: number, b: number) -> Result<number, string> {
  if b == 0 {
    return Err("Division by zero")
  }
  return Ok(a / b)
}
```

### Pattern Matching

Handle Results with match expressions:

```agentic
result = divide(10, 2) match {
  Ok(value) -> {
    console.log("Result: " + value)
    return value
  },
  Err(error) -> {
    console.log("Error: " + error)
    return 0
  }
}
```

## Incremental Development Stages

Agentic supports code evolution through stages:

### Stage 1: @stub (Not Implemented)

```agentic
@stub("Authentication logic not implemented yet")
@confidence(0.00)
func authenticate(token: string) -> Result<User, AuthError> {
  // This returns an error at runtime
}
```

### Stage 2: @partial (Works for Some Inputs)

```agentic
@partial("Only handles valid tokens, no error cases")
@confidence(0.60)
func authenticate(token: string) -> Result<User, AuthError> {
  decoded = jwt.decode(token)
  return Ok(User.fromDict(decoded))
  // Missing: empty token check, invalid token handling, etc.
}
```

### Stage 3: @complete (Fully Implemented)

```agentic
@complete
@confidence(0.95)
@property("rejects empty tokens")
@property("rejects invalid tokens")
@property("accepts valid tokens")
func authenticate(token: string) -> Result<User, AuthError> {
  if token.isEmpty() {
    return Err(AuthError.MISSING_TOKEN)
  }

  decoded = jwt.decode(token) match {
    Ok(payload) -> payload,
    Err(e) -> return Err(AuthError.INVALID_TOKEN)
  }

  return Ok(User.fromDict(decoded))
}
```

## Error Handling with Context

Add rich error context for debugging:

```agentic
@confidence(0.90)
func parseJSON(input: string) -> Result<JSONObject, ParseError> {
  parsed = JSON.parse(input) or error {
    @context {
      what_failed: "JSON parsing",
      input_preview: input.substring(0, 100),
      suggestions: [
        "Check for missing quotes",
        "Verify closing braces",
        "Validate with JSON linter"
      ],
      recovery: {
        action: "fix_and_retry",
        command: "jsonlint input.json"
      }
    }
    return Err(ParseError.INVALID_JSON)
  }

  return Ok(parsed)
}
```

## Context Requirements

Declare dependencies explicitly with `@needs`:

```agentic
@needs(database: Database, logger: Logger)
@confidence(0.92)
func saveUser(user: User) -> Result<void, DatabaseError> {
  logger.info("Saving user: " + user.id)

  database.users.insert(user) or error {
    logger.error("Failed to save user", error)
    return Err(DatabaseError.INSERT_FAILED)
  }

  return Ok(void)
}
```

## Property-Based Testing

Add property annotations to generate tests:

```agentic
@property("empty list returns empty")
@property("single item list works")
@property("maintains list length")
@confidence(0.95)
func filterPositive(numbers: number[]) -> number[] {
  return numbers.filter(n => n > 0)
}
```

Agentic automatically generates 1000 random test cases per property!

## Practice Exercises

### Exercise 1: Safe Division
Write a division function that:
- Returns Result<number, string>
- Handles division by zero
- Has @confidence(0.95)
- Includes property tests

### Exercise 2: Email Validator
Write an email validator that:
- Starts as @stub
- Upgrade to @partial (basic validation)
- Upgrade to @complete (full validation)
- Includes error context

### Exercise 3: User Lookup
Write a function that:
- Uses @needs(database: Database)
- Returns Result<User, DatabaseError>
- Handles missing users
- Includes property tests

## Solutions

<details>
<summary>Click to see solutions</summary>

### Solution 1:
```agentic
@confidence(0.95)
@property("division by zero returns error")
@property("division of positive numbers returns positive")
@complete
func safeDivide(a: number, b: number) -> Result<number, string> {
  if b == 0 {
    return Err("Cannot divide by zero")
  }
  return Ok(a / b)
}
```

### Solution 2:
```agentic
// Step 1: Stub
@stub("Email validation not implemented")
func validateEmail(email: string) -> Result<string, ValidationError>

// Step 2: Partial
@partial("Only checks for @ symbol")
@confidence(0.50)
func validateEmail(email: string) -> Result<string, ValidationError> {
  if email.includes("@") {
    return Ok(email)
  }
  return Err(ValidationError.INVALID_FORMAT)
}

// Step 3: Complete
@complete
@confidence(0.90)
@property("rejects emails without @")
@property("rejects emails without domain")
@property("accepts valid emails")
func validateEmail(email: string) -> Result<string, ValidationError> {
  if !email.includes("@") {
    return Err(ValidationError.MISSING_AT)
  }

  parts = email.split("@")
  if parts.length != 2 {
    return Err(ValidationError.INVALID_FORMAT)
  }

  if parts[1].isEmpty() {
    return Err(ValidationError.MISSING_DOMAIN)
  }

  return Ok(email)
}
```

</details>

## Key Takeaways

- ✅ Use `Result<T, E>` for functions that can fail
- ✅ Pattern match with `match` expressions
- ✅ Start with @stub, evolve to @complete
- ✅ Add @property annotations for automatic testing
- ✅ Use @needs to declare dependencies
- ✅ Include @context in error blocks

## Next Steps

- [Tutorial 3: Intermediate](./03-intermediate.md) - Advanced error handling and property testing
- [Cookbook](../cookbook/README.md) - Common patterns and recipes
- [Language Specification](../SPECIFICATION.md) - Complete language reference

---

**Previous:** [← Hello World](./01-hello-world.md) | **Next:** [Intermediate →](./03-intermediate.md)
