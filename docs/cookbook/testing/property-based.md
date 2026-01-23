# Recipe: Property-Based Testing

## Problem

You want to test your function with thousands of random inputs to find edge cases, but writing individual test cases is tedious and incomplete.

## Solution

Use `@property` annotations to auto-generate property-based tests:

```agentic
@confidence(0.95)
@complete
@property("never returns null")
@property("output length <= input length")
@property("handles empty strings")
func removeSpaces(input: string) -> string {
  return input.replace(/ /g, '')
}
```

Agentic automatically generates:
- 1000 random test cases per property
- Edge case testing (empty, Unicode, special chars)
- Shrinking to minimal failing case

## Discussion

### Why Property-Based Testing for AI Code?

AI agents often miss edge cases that humans wouldn't. Property-based testing:
- Tests with random inputs you wouldn't think of
- Finds edge cases automatically
- Validates code works for ALL inputs, not just examples
- Increases confidence in AI-generated code

### How It Works

When you compile your code:

```bash
agentic compile myfile.agentic --generate-tests
```

Agentic generates a test file:

```typescript
import * as fc from 'fast-check';

test.prop([fc.string()])('removeSpaces never returns null', (input) => {
  const result = removeSpaces(input);
  expect(result).not.toBeNull();
  expect(result).not.toBeUndefined();
}, { numRuns: 1000 });

test.prop([fc.string()])('removeSpaces output length <= input length', (input) => {
  const result = removeSpaces(input);
  expect(result.length).toBeLessThanOrEqual(input.length);
}, { numRuns: 1000 });
```

### Auto-Inferred Properties

Agentic automatically infers properties from:

**1. Function Name:**
```agentic
func isEven(n: number) -> boolean
// Auto-infers: @property("returns boolean")
```

**2. Parameter Types:**
```agentic
func process(text: string) -> string
// Auto-infers:
// - @property("handles empty string")
// - @property("handles whitespace")
// - @property("handles Unicode")
```

**3. Return Types:**
```agentic
func divide(a: number, b: number) -> Result<number, string>
// Auto-infers:
// - @property("handles success case")
// - @property("handles error case")
// - @property("never returns null")
```

**4. Confidence Levels:**
```agentic
@confidence(0.95)
func highConfidenceFunc() -> number
// Auto-infers: @property("passes all property tests")
```

## Examples

### Example 1: List Operations

```agentic
@confidence(0.96)
@complete
@property("preserves list length")
@property("maintains element order")
@property("handles empty list")
@property("handles single element")
func reverse<T>(list: T[]) -> T[] {
  return list.reverse()
}
```

Generated tests cover:
- Empty arrays
- Single-element arrays
- Large arrays (1000+ elements)
- Duplicate elements
- Edge types (null, undefined, objects)

### Example 2: Result Type Functions

```agentic
@confidence(0.94)
@complete
@property("division by zero returns Err")
@property("positive numbers return positive result")
@property("result is deterministic")
func safeDivide(a: number, b: number) -> Result<number, string> {
  if b == 0 {
    return Err("Division by zero")
  }
  return Ok(a / b)
}
```

Generated tests validate:
- Error path (b == 0)
- Success path (b != 0)
- Edge cases (infinity, NaN, very large numbers)
- Determinism (same input → same output)

### Example 3: Custom Arbitraries

For complex types, define custom generators:

```agentic
@confidence(0.90)
@property("validates email format", generator: emailArbitrary)
@property("rejects invalid emails", generator: invalidEmailArbitrary)
func validateEmail(email: string) -> Result<string, ValidationError> {
  // Validation logic
}

// Custom generators (in TypeScript)
const emailArbitrary = fc.emailAddress();
const invalidEmailArbitrary = fc.oneof(
  fc.constant("no-at-sign"),
  fc.constant("@no-local"),
  fc.constant("no-domain@")
);
```

## Best Practices

### 1. Start with Simple Properties

```agentic
@property("never returns null")  // ✓ Simple, clear
@property("output is valid")     // ✗ Too vague
```

### 2. Test Both Success and Failure

```agentic
@property("accepts valid input")
@property("rejects invalid input")
```

### 3. Use Confidence as Guide

```agentic
@confidence(0.95) → add 3+ properties
@confidence(0.80) → add 2+ properties
@confidence(0.60) → add 1+ property + @uncertain
```

### 4. Combine with Unit Tests

Property tests find edge cases, unit tests document expected behavior:

```agentic
// Property test (auto-generated)
@property("handles all positive numbers")

// Unit test (explicit)
test("safeDivide(10, 2) returns 5", () => {
  expect(safeDivide(10, 2)).toEqual(Ok(5))
})
```

## Variations

### With Shrinking

When a test fails, fast-check automatically shrinks to minimal failing case:

```
Property failed for: { input: "a very long string with special chars !@#$%^&*()" }
Shrinking...
Minimal failing input: { input: "!" }
```

### With Preconditions

Test only valid inputs:

```agentic
@property("square root of positive is positive",
          precondition: "x > 0")
func sqrt(x: number) -> number {
  return Math.sqrt(x)
}
```

### With Statistics

Collect statistics about test inputs:

```agentic
@property("distribution check",
          statistics: true)
func process(x: number) -> number {
  // After 1000 runs, shows:
  // - 50% positive, 48% negative, 2% zero
  // - Range: -1000 to 1000
  // - Mean: 5.2
}
```

## Troubleshooting

### Property Fails for Valid Input

**Problem:** Test fails but the input seems valid

**Solution:** Check the property assertion, not the function:

```agentic
@property("result > input")  // ❌ Fails for input = 100, result = 100
@property("result >= input") // ✓ Correct
```

### Too Many Test Runs

**Problem:** Tests are slow (1000 runs × 10 properties = 10,000 tests)

**Solution:** Reduce runs for fast feedback, increase for CI:

```bash
agentic test --numRuns=100  # Development
agentic test --numRuns=1000 # CI/CD
```

### Flaky Tests

**Problem:** Test passes sometimes, fails sometimes

**Solution:** Function is non-deterministic (uses random, time, network):

```agentic
@effects(random)  // Declare non-determinism
@property("output is within valid range")  // Test bounds, not exact values
func generateRandom() -> number {
  return Math.random()
}
```

## See Also

- [Custom Test Generators](./custom-arbitraries.md)
- [Mutation Testing](./mutation.md) - Validate test quality
- [Integration Testing](./integration.md)
- [fast-check Documentation](https://github.com/dubzzz/fast-check)

---

**Pro Tip:** Run `agentic analyze-properties myfile.agentic` to see all auto-inferred properties before compiling!
