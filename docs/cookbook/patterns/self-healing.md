# Recipe: Self-Healing Systems

## Problem

Your production system fails occasionally, and you need someone to manually restart it. You want automatic recovery so your system heals itself.

## Solution

Use `@healthcheck` and `@recovery` annotations:

```agentic
@healthcheck(interval: 30s)
@confidence(0.94)
@effects(database, io)
func checkDatabaseHealth() -> HealthStatus {
  try {
    @timeout(5s)
    database.ping()

    return HealthStatus.OK
  } catch {
    @trace_health_failure("database_ping_failed", {
      timestamp: now(),
      consecutiveFailures: getConsecutiveFailures()
    })

    return HealthStatus.FAILED
  }
}

@recovery(
  for: checkDatabaseHealth,
  maxAttempts: 3,
  backoff: "exponential",
  escalateAfter: 3
)
@confidence(0.87)
@effects(database, io, human_interaction)
func healDatabase() -> Result<void, RecoveryError> {
  logger.warn("🏥 Attempting database recovery...")

  // Strategy 1: Reconnect
  @attempt(1, wait: 5s)
  database.reconnect() match {
    Ok(_) -> {
      logger.info("✓ Database reconnected")
      return Ok(void)
    },
    Err(e) -> logger.warn("✗ Reconnect failed: ${e}")
  }

  // Strategy 2: Restart connection pool
  @attempt(2, wait: 15s)
  database.restartPool() match {
    Ok(_) -> {
      logger.info("✓ Pool restarted")
      return Ok(void)
    },
    Err(e) -> logger.error("✗ Pool restart failed: ${e}")
  }

  // Strategy 3: Escalate to human
  @attempt(3)
  @escalate_to_human({
    severity: "critical",
    system: "database",
    message: "Database cannot auto-recover. Manual intervention required.",
    context: {
      attempts: 3,
      errors: getErrorHistory(),
      metrics: getDatabaseMetrics()
    },
    oncall: ["database_team", "sre_team"]
  })

  return Err(RecoveryError.ESCALATED)
}
```

## Discussion

### Self-Healing Architecture

```
┌──────────────┐
│   Service    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Health Check │ ← Runs every 30s
│ (Monitor)    │
└──────┬───────┘
       │
       ▼ (if FAILED)
┌──────────────┐
│   Recovery   │
│  (Healer)    │
└──────┬───────┘
       │
       ├─ Attempt 1: Simple fix
       ├─ Attempt 2: Complex fix
       └─ Attempt 3: Escalate to human
```

### When to Use

**Perfect for:**
- Database connections (reconnect)
- External APIs (retry, circuit breaker)
- Cache systems (restart)
- File locks (release and retry)
- Memory leaks (restart process)

**Not suitable for:**
- Data corruption (needs human judgment)
- Security breaches (needs investigation)
- Hardware failures (needs physical intervention)

## Examples

### Example 1: Multi-System Health Check

```agentic
@healthcheck(interval: 60s)
@confidence(0.92)
func checkSystemHealth() -> SystemHealthStatus {
  checks = [
    ("database", checkDatabaseHealth()),
    ("redis", checkRedisHealth()),
    ("external_api", checkExternalAPIHealth()),
    ("disk_space", checkDiskSpace()),
    ("memory", checkMemoryUsage())
  ]

  failures = checks.filter(([name, status]) => status == HealthStatus.FAILED)

  overall = failures.length match {
    0 -> HealthStatus.OK,
    1 | 2 -> HealthStatus.DEGRADED,
    _ -> HealthStatus.FAILED
  }

  return SystemHealthStatus {
    overall: overall,
    components: checks,
    timestamp: now()
  }
}

@recovery(for: checkSystemHealth)
@confidence(0.85)
func healSystem() -> Result<void, Error> {
  // Parallel recovery for all failed components
  @parallel
  recoveries = [
    healDatabase(),
    healRedis(),
    healExternalAPI()
  ]

  results = await all(recoveries)

  failures = results.filter(r => r.isErr())

  if failures.length > 0 {
    @escalate_to_human("Multiple component failures")
  }

  return Ok(void)
}
```

### Example 2: Memory Leak Detection and Recovery

```agentic
@healthcheck(interval: 5m)
@confidence(0.89)
@effects(io, state)
func checkMemoryUsage() -> HealthStatus {
  usage = process.memoryUsage()
  threshold = 1024 * 1024 * 1024  // 1GB

  if usage.heapUsed > threshold {
    @alert("warning", {
      message: "Memory usage high",
      usage: usage.heapUsed,
      threshold: threshold
    })

    return HealthStatus.DEGRADED
  }

  if usage.heapUsed > threshold * 1.5 {
    @alert("critical", "Memory leak suspected")
    return HealthStatus.FAILED
  }

  return HealthStatus.OK
}

@recovery(for: checkMemoryUsage)
@confidence(0.82)
@uncertain("Process restart may cause brief downtime")
func healMemoryLeak() -> Result<void, Error> {
  logger.warn("🏥 High memory usage detected, attempting recovery...")

  // Strategy 1: Force garbage collection
  @attempt(1)
  global.gc() if global.gc  // Only if --expose-gc flag set

  usage = process.memoryUsage()
  if usage.heapUsed < threshold {
    logger.info("✓ GC recovered memory")
    return Ok(void)
  }

  // Strategy 2: Clear caches
  @attempt(2)
  cache.clear()
  sessionStore.clearExpired()

  usage = process.memoryUsage()
  if usage.heapUsed < threshold {
    logger.info("✓ Cache clearing recovered memory")
    return Ok(void)
  }

  // Strategy 3: Graceful restart
  @attempt(3)
  @escalate_to_human("Memory leak requires process restart")

  return Err(RecoveryError.RESTART_REQUIRED)
}
```

### Example 3: Deadlock Detection

```agentic
@healthcheck(interval: 10s)
@confidence(0.86)
@partial("Basic deadlock detection, not comprehensive")
func checkForDeadlocks() -> HealthStatus {
  activeTasks = getActiveTasks()
  stuckTasks = activeTasks.filter(task =>
    task.status == "running" &&
    (now() - task.startTime) > 5m  // Stuck for > 5 min
  )

  if stuckTasks.length > 0 {
    @trace_health_failure("potential_deadlock", {
      stuckTasks: stuckTasks.map(t => t.id),
      duration: stuckTasks.map(t => now() - t.startTime)
    })

    return HealthStatus.FAILED
  }

  return HealthStatus.OK
}

@recovery(for: checkForDeadlocks)
@confidence(0.79)
@uncertain("Killing tasks may cause data inconsistency")
func healDeadlocks() -> Result<void, Error> {
  stuckTasks = getActiveTasks().filter(task => isStuck(task))

  for task in stuckTasks {
    logger.warn("🏥 Killing stuck task: ${task.id}")

    @requires_approval(timeout: 2m, fallback: "kill")
    task.kill()

    // Restart if necessary
    if task.restartable {
      task.restart()
    }
  }

  return Ok(void)
}
```

## Testing Self-Healing

### Chaos Engineering

Intentionally break things to test recovery:

```agentic
@chaos_test
@confidence(0.88)
func testDatabaseRecovery() {
  // Force database failure
  database.simulateFailure()

  // Wait for health check to detect (30s + buffer)
  sleep(35s)

  // Verify recovery was attempted
  expect(healDatabase).toHaveBeenCalled()

  // Verify recovery succeeded
  expect(database.isHealthy()).toBe(true)
}

@chaos_test
@confidence(0.85)
func testCascadeRecovery() {
  // Simulate cascade failure
  redis.simulateFailure()
  database.simulateFailure()

  sleep(65s)  // Wait for both recoveries

  // Both should be healthy
  expect(redis.isHealthy()).toBe(true)
  expect(database.isHealthy()).toBe(true)
}
```

## Real-World Results

### Case Study: E-Commerce Platform

**Before self-healing:**
- 5-10 manual interventions per day
- Average resolution time: 15 minutes
- Total downtime: 75-150 minutes/day

**After self-healing:**
- 0.5 manual interventions per day (90% reduction)
- Average auto-recovery time: 30 seconds
- Total downtime: 7.5 minutes/day (95% reduction)

**Savings:** 2 hours engineer time per day = $50K+/year

### Configuration

```agentic
@healthcheck(interval: 30s)          // Database
@healthcheck(interval: 60s)          // Redis
@healthcheck(interval: 5m)           // External APIs
@healthcheck(interval: 1m)           // Disk space

@recovery(maxAttempts: 3, escalateAfter: 3)
```

## Best Practices

### 1. Health Check Frequency

- **Critical services:** 30s
- **Important services:** 60s
- **Nice-to-have services:** 5m
- **Resource checks:** 1-5m

### 2. Recovery Strategies

Order from simple to complex:
1. Reconnect/restart
2. Clear caches/reset state
3. Restart process/container
4. Escalate to human

### 3. Escalation Policy

- **Attempt 1-2:** Auto-recovery
- **Attempt 3:** Alert on-call
- **After 3 attempts:** Create incident, page team

### 4. Avoid Recovery Loops

```agentic
@recovery(
  cooldown: 5m  // Don't attempt recovery more than once per 5min
)
```

Prevents:
- Rapid restart loops
- Resource exhaustion
- Alert storms

## Metrics

Track self-healing effectiveness:

```agentic
@confidence(0.93)
func getSelfHealingMetrics(period: Period) -> SelfHealingReport {
  return {
    totalFailures: getFailureCount(period),
    autoRecovered: getRecoveryCount(period, outcome: "success"),
    escalatedToHuman: getRecoveryCount(period, outcome: "escalated"),
    recoverySuccessRate: autoRecovered / totalFailures,
    averageRecoveryTime: getAverageRecoveryTime(period),
    mttr: getMTTR(period),  // Mean Time To Recovery
    downtime: getTotalDowntime(period)
  }
}
```

## See Also

- [Health Check Patterns](./health-checks.md)
- [Circuit Breaker](../error-handling/circuit-breaker.md)
- [Chaos Engineering](../../advanced/chaos-engineering.md)
- [Observability Guide](../../guides/observability.md)

---

**Pro Tip:** Test your self-healing in staging with chaos engineering before deploying to production!
