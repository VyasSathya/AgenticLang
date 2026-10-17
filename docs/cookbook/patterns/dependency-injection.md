# Recipe: Dependency Injection with @needs

## Problem

Your functions depend on external services (database, HTTP client, logger) but you want:
- Type safety for dependencies
- Easy testing with mocks
- Clear documentation of requirements
- Compile-time validation

## Solution

Use `@needs` to declare dependencies explicitly:

```agentic
@needs(
  database: Database,
  logger: Logger,
  config: AppConfig
)
@confidence(0.93)
@complete
func processUser(userId: string) -> Result<User, Error> {
  // All dependencies are guaranteed available
  logger.info("Processing user: ${userId}")

  user = database.users.find(userId) match {
    Ok(Some(u)) -> u,
    Ok(None) -> {
      logger.warn("User not found: ${userId}")
      return Err(Error.USER_NOT_FOUND)
    },
    Err(e) -> {
      logger.error("Database error", e)
      return Err(Error.DATABASE_ERROR(e))
    }
  }

  timeout = config.get("processing_timeout")

  @timeout(timeout)
  result = transformUser(user)

  return Ok(result)
}
```

## Discussion

### Why @needs Instead of Global State?

**❌ Traditional approach (global state):**
```javascript
// Implicit dependencies - hard to test, hard to understand
function processUser(userId) {
  logger.info(`Processing ${userId}`);  // Where did logger come from?
  const user = db.query(...);            // Where did db come from?
}
```

**✅ Agentic approach (explicit dependencies):**
```agentic
@needs(database: Database, logger: Logger)
func processUser(userId: string) -> Result<User, Error> {
  // Dependencies are explicit, type-safe, and validated
}
```

### Benefits

1. **Type Safety** - Compiler checks dependencies exist
2. **Testability** - Easy to provide mocks
3. **Documentation** - Clear what the function needs
4. **Composition** - Dependencies flow through call chains
5. **Flexibility** - Different implementations for different environments

## Examples

### Example 1: Testing with Mocks

```agentic
// Production implementation
@needs(database: Database, logger: Logger)
@confidence(0.92)
func saveUser(user: User) -> Result<void, Error> {
  logger.info("Saving user: ${user.id}")
  database.users.insert(user)
  return Ok(void)
}

// Test with mocks
@test
func testSaveUser() {
  mockDB = MockDatabase()
  mockLogger = MockLogger()

  result = saveUser(testUser, context: {
    database: mockDB,
    logger: mockLogger
  })

  expect(result.ok).toBe(true)
  expect(mockDB.insertCalled).toBe(true)
  expect(mockLogger.infoCalledWith("Saving user: test-id")).toBe(true)
}
```

### Example 2: Scoped Capabilities

Limit access with fine-grained permissions:

```agentic
// Read-only database access to specific tables
@needs(database: Database.read{users, posts})
@confidence(0.94)
func getUserWithPosts(userId: string) -> Result<UserProfile, Error> {
  // Can only read from users and posts tables
  // Cannot write
  // Cannot access other tables (e.g., admin, secrets)

  user = database.users.find(userId)
  posts = database.posts.findByUser(userId)

  return Ok(UserProfile { user, posts })
}

// Write access to users table only
@needs(database: Database.write{users})
@confidence(0.91)
func updateUser(userId: string, data: UserUpdate) -> Result<void, Error> {
  // Can write to users table
  // Cannot read from other tables
  // Cannot write to other tables

  database.users.update(userId, data)
  return Ok(void)
}

// Full access (use sparingly!)
@needs(database: Database.admin)
@requires_permission("admin")
@confidence(0.89)
func dangerousOperation() -> Result<void, Error> {
  // Has full database access
  // Requires admin permission
  // Use only when necessary
}
```

### Example 3: Capability Composition

Combine capabilities:

```agentic
capability DataAccess = Database.read{users} + Cache.read + Logger

@needs(caps: DataAccess)
@confidence(0.93)
func cachedUserLookup(userId: string) -> Result<User, Error> {
  // Check cache first
  cache.get("user:${userId}") match {
    Some(cached) -> return Ok(cached),
    None -> {}
  }

  // Fetch from database
  user = database.users.find(userId)

  // Store in cache
  cache.set("user:${userId}", user, ttl: 5m)

  logger.info("User cached: ${userId}")

  return Ok(user)
}
```

### Example 4: Environment-Specific Implementations

```agentic
// Define interface
@needs(storage: Storage)
@confidence(0.94)
func saveFile(path: string, content: string) -> Result<void, Error> {
  storage.write(path, content)
  return Ok(void)
}

// Production: S3 storage
@production
func createContext() -> Context {
  return {
    storage: S3Storage(bucket: "prod-bucket")
  }
}

// Development: Local file system
@development
func createContext() -> Context {
  return {
    storage: LocalFileStorage(basePath: "./dev-storage")
  }
}

// Testing: In-memory
@test
func createContext() -> Context {
  return {
    storage: InMemoryStorage()
  }
}
```

## Advanced Patterns

### Pattern 1: Dependency Providers

```agentic
@provider("database")
@confidence(0.95)
func provideDatabase(config: DatabaseConfig) -> Database {
  return PostgresDatabase(config)
}

@provider("logger")
@confidence(0.98)
func provideLogger(level: LogLevel) -> Logger {
  return ConsoleLogger(level)
}

// Framework auto-injects dependencies
@auto_inject
@needs(database: Database, logger: Logger)
func myFunction() -> Result<void, Error> {
  // Dependencies automatically provided by framework
}
```

### Pattern 2: Contextual Dependencies

```agentic
// Different dependencies per request
@needs(database: Database, userId: string)
@confidence(0.90)
func getUserSpecificData() -> Result<Data, Error> {
  // userId flows through as context
  // Each request has different userId
}

// Call with context
@request_scoped
func handleRequest(request: Request) -> Response {
  userId = authenticate(request.token)

  data = getUserSpecificData(context: {
    database: database,
    userId: userId  // Request-specific context
  })

  return Response(data)
}
```

### Pattern 3: Lazy Initialization

```agentic
@needs(database: Lazy<Database>)
@confidence(0.91)
func maybeUseDatabase(condition: boolean) -> Result<void, Error> {
  if condition {
    // Database only initialized if needed
    db = database.get()
    db.query("SELECT ...")
  }

  return Ok(void)
}
```

## Best Practices

### 1. Minimal Dependencies

```agentic
// ✓ Good: Only what's needed
@needs(database: Database.read{users})

// ✗ Bad: Asking for everything
@needs(database: Database.admin, cache: Cache, logger: Logger, http: HttpClient, ...)
```

### 2. Specific Scopes

```agentic
// ✓ Good: Specific permission
@needs(database: Database.write{users})

// ✗ Bad: Overly broad
@needs(database: Database)  // Can access all tables
```

### 3. Document Why

```agentic
@needs(
  database: Database,      // User data persistence
  logger: Logger,          // Audit trail
  cache: Cache,           // Performance optimization
  emailService: EmailService  // Notification
)
```

## Testing Strategies

### Strategy 1: Mock All Dependencies

```agentic
@test
@confidence(0.96)
func testWithMocks() {
  mocks = {
    database: MockDatabase(),
    logger: MockLogger(),
    cache: MockCache()
  }

  result = myFunction(testInput, context: mocks)

  // Verify behavior
  expect(mocks.database.insertCalled).toBe(true)
  expect(mocks.logger.infoCalls.length).toBeGreaterThan(0)
}
```

### Strategy 2: Real Dependencies in Integration Tests

```agentic
@integration_test
@confidence(0.88)
func testWithRealDatabase() {
  // Use test database instance
  testDB = createTestDatabase()

  context = {
    database: testDB,
    logger: TestLogger(),
    cache: InMemoryCache()
  }

  result = myFunction(testInput, context)

  // Verify database state
  saved = testDB.users.find(testUser.id)
  expect(saved).toBeDefined()

  // Cleanup
  testDB.destroy()
}
```

### Strategy 3: Property-Based Testing with Arbitrary Dependencies

```agentic
@test
@confidence(0.89)
func testWithArbitraryImplementations() {
  test.prop([
    fc.database(),  // Generates various Database implementations
    fc.logger(),    // Generates various Logger implementations
  ])('works with any implementation', (db, log) => {
    result = myFunction(input, context: { database: db, logger: log })
    expect(result).toBeDefined()
  }, { numRuns: 100 })
}
```

## Common Patterns

### Pattern: Request Context

```agentic
type RequestContext {
  database: Database
  logger: Logger
  currentUser: User
  requestId: string
  traceId: string
}

@needs(ctx: RequestContext)
@confidence(0.92)
func handleAPIRequest(request: APIRequest) -> Response {
  ctx.logger.info("Request ${ctx.requestId} from user ${ctx.currentUser.id}")

  // All dependencies available from context
}
```

### Pattern: Service Locator

```agentic
type ServiceLocator {
  func get<T>(name: string) -> T
  func register<T>(name: string, implementation: T) -> void
}

@needs(services: ServiceLocator)
@confidence(0.87)
func flexibleFunction() -> Result<void, Error> {
  // Dynamically resolve dependencies
  database = services.get<Database>("database")
  logger = services.get<Logger>("logger")

  // Use dependencies
}
```

## Troubleshooting

### Error: Missing Dependency

```
error[A003]: dependency `database` declared in @needs but not available
  --> myfile.agentic:5:1
   |
 5 | @needs(database: Database)
   |        ^^^^^^^^
   |
   = suggested fixes:
     1. provide dependency when calling function
        myFunction(..., context: { database: db })
     2. register global dependency
        runtime.register('database', dbInstance)
```

**Solution:** Provide the dependency when calling the function.

### Error: Type Mismatch

```
error[T001]: type mismatch in @needs declaration
  --> myfile.agentic:5:1
   |
 5 | @needs(database: Database)
   |                  ^^^^^^^^
   | expected `Database`, provided `PostgresDB`
```

**Solution:** Ensure provided type matches or extends declared type.

## See Also

- [Testing Guide](../testing/integration.md)
- [Service Locator Pattern](./service-locator.md)
- [Mock Objects Guide](../testing/mocking.md)
- [Context Management](../../advanced/context.md)

---

**Pro Tip:** Use `agentic analyze --dependencies myfile.agentic` to visualize the dependency graph!
