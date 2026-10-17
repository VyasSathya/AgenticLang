# Tutorial 1: Hello World in Agentic

**Level:** Beginner
**Time:** 15 minutes
**Prerequisites:** None

## What You'll Learn

In this tutorial, you'll:
- Install the Agentic compiler
- Write your first Agentic program
- Understand confidence annotations
- Compile and run Agentic code

## Installation

Install Agentic via npm:

```bash
npm install -g agentic-lang
```

Verify installation:

```bash
agentic version
```

You should see: `Agentic v0.1.0`

## Your First Program

Create a file called `hello.agentic`:

```agentic
@confidence(0.99)
@complete
func greet(name: string) -> string {
  return "Hello, " + name + "!"
}
```

Let's break this down:

- `@confidence(0.99)` - We're 99% confident this code is correct
- `@complete` - This function is fully implemented (not a stub or partial)
- `func greet(...)` - Function declaration
- `-> string` - Return type annotation
- `return "Hello, " + name + "!"` - Function body

## Compile It

Compile your Agentic code to TypeScript:

```bash
agentic compile hello.agentic
```

This generates `hello.ts`:

```typescript
export function greet(name: string): string {
  return "Hello, " + name + "!";
}
```

## Add Some Uncertainty

Real-world code isn't always perfect. Let's write a function with lower confidence:

```agentic
@confidence(0.75)
@partial("Only handles simple email formats")
@uncertain("Complex email validation rules not fully implemented")
func validateEmail(email: string) -> Result<string, string> {
  if email.includes("@") {
    return Ok(email)
  }
  return Err("Invalid email: missing @")
}
```

Notice:
- `@confidence(0.75)` - We're only 75% confident
- `@partial` - This is a partial implementation
- `@uncertain` - We explain what we're uncertain about
- `Result<string, string>` - Return type handles success and failure

Compile it:

```bash
agentic compile hello.agentic --output hello.ts
```

## Understanding Result Types

Agentic uses `Result<T, E>` for functions that can fail:

```agentic
@confidence(0.95)
func divide(a: number, b: number) -> Result<number, string> {
  if b == 0 {
    return Err("Division by zero")
  }
  return Ok(a / b)
}
```

Use pattern matching to handle results:

```agentic
result = divide(10, 2) match {
  Ok(value) -> value,
  Err(error) -> {
    console.log("Error: " + error)
    return 0
  }
}
```

## Next Steps

Great work! You've learned the basics of Agentic. Next:

- [Tutorial 2: Fundamentals](./02-fundamentals.md) - Learn about types, stages, and error handling
- [Try the Playground](https://agentic-lang.org/playground) - Experiment in your browser
- [Read the Language Spec](../specification.md) - Deep dive into all features

## Practice Exercises

1. Write a function that adds two numbers with 95% confidence
2. Write a partial implementation of `parseJSON` that only handles simple objects
3. Create a function that returns `Result<number, string>` for safe division

## Get Help

- [Discord #help channel](https://discord.gg/agentic)
- [GitHub Discussions](https://github.com/agentic-lang/agentic/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/agentic-lang)

---

**Next:** [Fundamentals →](./02-fundamentals.md)
