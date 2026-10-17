# Tutorial 3: Intermediate Agentic

**Level:** Intermediate
**Time:** 1 hour
**Prerequisites:** [Tutorial 2: Fundamentals](./02-fundamentals.md)

## What You'll Learn

- Advanced error handling with recovery blocks
- Context requirements and dependency injection
- Multi-agent coordination basics
- Session persistence and resumption
- Effect tracking
- Production deployment patterns

## Advanced Error Handling

### Error Recovery Blocks

Add structured context to errors for better debugging:

```agentic
@confidence(0.90)
@needs(database: Database, logger: Logger)
func saveUser(user: User) -> Result<void, DatabaseError> {
  logger.info("Saving user: ${user.id}")

  database.users.insert(user) or error {
    @context {
      what_failed: "User insertion",
      current_state: { userId: user.id, attempted: true },
      likely_cause: "Duplicate user ID or constraint violation",
      suggestions: [
        "Check if user already exists",
        "Verify user data is valid",
        "Check database constraints"
      ],
      recovery: {
        action: "update_instead_of_insert",
        command: "database.users.update(user)"
      }
    }

    logger.error("Failed to save user ${user.id}", error)
    return Err(DatabaseError.INSERT_FAILED)
  }

  logger.info("User ${user.id} saved successfully")
  return Ok(void)
}
```

The `@context` block provides:
- **what_failed:** What operation failed
- **current_state:** System state when error occurred
- **likely_cause:** Root cause analysis
- **suggestions:** Human-readable fixes
- **recovery:** Machine-readable recovery strategy

### Error Chaining

Wrap errors with additional context:

```agentic
@confidence(0.88)
func processOrder(orderId: string) -> Result<Order, ProcessError> {
  user = fetchUser(orderId) match {
    Ok(u) -> u,
    Err(e) -> {
      return Err(ProcessError.USER_FETCH_FAILED {
        cause: e,
        orderId: orderId
      })
    }
  }

  payment = processPayment(user) match {
    Ok(p) -> p,
    Err(e) -> {
      return Err(ProcessError.PAYMENT_FAILED {
        cause: e,
        userId: user.id,
        orderId: orderId
      })
    }
  }

  return Ok(Order { user, payment })
}
```

## Context Requirements and Dependency Injection

### Declaring Dependencies

Use `@needs` to declare what your function requires:

```agentic
@needs(
  database: Database,
  logger: Logger,
  config: AppConfig,
  cache: Cache
)
@effects(database, io, state)
@confidence(0.92)
func complexOperation(data: Data) -> Result<Output, Error> {
  // All dependencies are guaranteed available
  logger.info("Starting operation")
  cached = cache.get("key")
  result = database.query("SELECT * FROM table")
  return Ok(result)
}
```

### Providing Context at Runtime

```typescript
// When calling Agentic functions from TypeScript:
const context = {
  database: new PostgresDB(connectionString),
  logger: new ConsoleLogger(),
  config: loadConfig(),
  cache: new RedisCache()
};

const result = complexOperation(data, context);
```

### Scoped Capabilities

Limit access with scoped permissions:

```agentic
@needs(database: Database.read{users, posts})  // Read-only, specific tables
@confidence(0.95)
func getUserPosts(userId: string) -> Result<Post[], Error> {
  // Can only read from users and posts tables
  // Cannot write, cannot access other tables
}

@needs(database: Database.write{users})  // Write to users only
@confidence(0.93)
func updateUser(user: User) -> Result<void, Error> {
  // Can write to users table only
}
```

## Multi-Agent Coordination

### Message Passing with Channels

```agentic
@agent(role: "data_processor")
agent DataProcessorAgent {
  inbox: Channel<DataRequest>
  outbox: Channel<DataResponse>

  @handler("data_request")
  @confidence(0.87)
  func process(request: DataRequest) -> DataResponse {
    @trace_decision("processing_strategy", {
      dataSize: request.data.length,
      complexity: estimateComplexity(request)
    })

    processed = transform(request.data)

    return DataResponse {
      requestId: request.id,
      result: processed,
      confidence: 0.87
    }
  }
}

// Spawn and communicate with agents
@confidence(0.85)
func coordinateWork(data: Data) -> Result<Output, Error> {
  processor = spawn DataProcessorAgent()

  // Send request
  processor.inbox.send(DataRequest { data: data, id: generateId() })

  // Wait for response
  @timeout(30s)
  response = processor.outbox.receive() match {
    Some(resp) -> resp,
    None -> return Err(Error.TIMEOUT)
  }

  return Ok(response.result)
}
```

### Session Persistence

Save and resume long-running operations:

```agentic
@session(id: "user_onboarding_${userId}", storage: "database")
@resumable
@checkpoint_interval(5m)
@confidence(0.90)
func onboardUser(userId: string) -> Result<User, OnboardingError> {
  // Step 1: Create account
  @checkpoint("account_created")
  account = createAccount(userId)
  session.save({ step: 1, accountId: account.id })

  // Step 2: Send verification email
  @checkpoint("email_sent")
  sendEmail(account.email, "Verify your account")
  session.save({ step: 2, emailSent: true })

  // Step 3: Wait for verification (can take hours/days)
  @checkpoint("awaiting_verification")
  @resumable_point  // Can pause here and resume later
  verification = awaitEmailVerification(account.id, timeout: 24h)

  if verification.timedOut {
    @pause_session({
      reason: "Awaiting user email verification",
      resumeOn: "email_verified_event",
      nextStep: "complete_onboarding"
    })
    return Err(OnboardingError.VERIFICATION_PENDING)
  }

  // Step 4: Complete
  @checkpoint("complete")
  user = finalizeAccount(account, verification)

  return Ok(user)
}

// Resume from checkpoint
@confidence(0.92)
func resumeOnboarding(sessionId: string) -> Result<User, Error> {
  session = Session.restore(sessionId) match {
    Some(s) -> s,
    None -> return Err(Error.SESSION_NOT_FOUND)
  }

  // Resume from last checkpoint
  return onboardUser.resumeFrom(session.lastCheckpoint)
}
```

## Effect Tracking

### Declaring Effects

Make side effects explicit:

```agentic
@effects(io, network, database)
@needs(http: HttpClient, db: Database, logger: Logger)
@confidence(0.88)
func syncData(source: string) -> Result<void, SyncError> {
  // Effects are tracked:
  // - io: logger.info()
  // - network: http.get()
  // - database: db.insert()

  logger.info("Starting sync from ${source}")

  data = http.get(source) match {
    Ok(response) -> response.json(),
    Err(e) -> return Err(SyncError.FETCH_FAILED(e))
  }

  db.insert("synced_data", data)

  return Ok(void)
}
```

### Pure Functions

Explicitly mark functions with no side effects:

```agentic
@effects(pure)
@confidence(0.99)
@complete
@property("deterministic")
@property("no side effects")
func calculateTax(amount: number, rate: number) -> number {
  // Pure function - same input always gives same output
  // No I/O, no state mutation, no network calls
  return amount * rate
}
```

### Effect Handlers

Substitute different implementations for effects:

```agentic
// Production handler (real I/O)
@effects(io)
func logMessage(message: string) -> void {
  console.log(message)
}

// Test handler (mock I/O)
@test
with MockLogger {
  @effects(pure)  // No actual I/O in tests
  func logMessage(message: string) -> void {
    mockLogger.record(message)
  }
}
```

## Production Deployment Patterns

### Health Checks

Add automatic health monitoring:

```agentic
@healthcheck(interval: 30s)
@confidence(0.96)
func checkDatabaseHealth() -> HealthStatus {
  try {
    database.ping()
    return HealthStatus.OK
  } catch {
    return HealthStatus.FAILED
  }
}

@recovery(for: checkDatabaseHealth)
@confidence(0.85)
func healDatabase() -> Result<void, Error> {
  logger.warn("Database health check failed, attempting recovery")

  database.reconnect() match {
    Ok(_) -> {
      logger.info("Database connection restored")
      return Ok(void)
    },
    Err(e) -> {
      @escalate_to_human("Database cannot be recovered automatically")
      return Err(Error.RECOVERY_FAILED(e))
    }
  }
}
```

### Circuit Breaker

Prevent cascade failures:

```agentic
@circuit_breaker(
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60s
)
@confidence(0.89)
func callExternalAPI(request: Request) -> Result<Response, ApiError> {
  // After 5 consecutive failures, circuit opens
  // Requests fail fast without calling API
  // After 60s, circuit moves to half-open
  // After 2 successes, circuit closes
}
```

### Graceful Degradation

```agentic
@confidence(0.92)
@complete
@property("tries all fallbacks before failing")
func fetchData(key: string) -> Result<Data, Error> {
  // Try primary source
  primaryAPI.fetch(key) match {
    Ok(data) -> return Ok(data),
    Err(_) -> {
      // Try backup
      backupAPI.fetch(key) match {
        Ok(data) -> return Ok(data),
        Err(_) -> {
          // Use cache
          cache.get(key) match {
            Some(data) -> return Ok(data),
            None -> return Err(Error.ALL_SOURCES_FAILED)
          }
        }
      }
    }
  }
}
```

## Practice Project: Build a Task Queue

Build a resilient task queue system that:

1. Accepts tasks via HTTP endpoint
2. Stores tasks in database
3. Processes tasks with worker agents
4. Handles failures with retry logic
5. Monitors health and recovers automatically
6. Tracks confidence per task type

**Requirements:**
- Use @needs for dependencies
- Add @property tests for all functions
- Implement error recovery blocks
- Use session persistence for long tasks
- Track effects (@effects annotations)
- Maintain 0.90+ confidence on critical paths

## Key Takeaways

- ✅ Use `@context` blocks for rich error information
- ✅ Declare dependencies with `@needs` for safety
- ✅ Track effects to make side effects explicit
- ✅ Use agents and channels for coordination
- ✅ Implement health checks and recovery
- ✅ Always explain uncertainty with `@uncertain`

## Next Steps

- [Tutorial 4: Advanced](./04-advanced.md) - Self-healing systems, formal verification
- [Cookbook: Error Handling](../cookbook/error-handling/) - Production patterns
- [Multi-Agent Guide](../guides/multi-agent.md) - Agent coordination

---

**Previous:** [← Fundamentals](./02-fundamentals.md) | **Next:** [Advanced →](./04-advanced.md)
