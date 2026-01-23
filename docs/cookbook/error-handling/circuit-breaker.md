# Recipe: Circuit Breaker Pattern

## Problem

Your service calls an external API that sometimes fails. You want to:
- Prevent cascade failures
- Fail fast when service is down
- Auto-recover when service is healthy again
- Protect your system from overload

## Solution

Use the `@circuit_breaker` annotation:

```agentic
@circuit_breaker(
  failureThreshold: 5,      // Open after 5 failures
  successThreshold: 2,      // Close after 2 successes
  timeout: 60s              // Try again after 60s
)
@confidence(0.91)
@complete
@property("fails fast when circuit open")
@property("recovers when service healthy")
@needs(http: HttpClient, logger: Logger)
func callExternalAPI(request: Request) -> Result<Response, ApiError> {
  @trace_circuit_breaker("external_api", {
    state: circuitBreaker.getState(),
    failureCount: circuitBreaker.getFailureCount()
  })

  response = http.post("https://api.example.com/endpoint", request) match {
    Ok(resp) -> resp,
    Err(e) -> {
      @context {
        what_failed: "External API call",
        suggestions: ["Check API status", "Verify network connectivity"],
        recovery: { action: "retry_later", wait: "60s" }
      }
      logger.error("API call failed", e)
      return Err(ApiError.CALL_FAILED(e))
    }
  }

  return Ok(response)
}
```

## Discussion

### Circuit Breaker States

```
CLOSED (Normal Operation)
    ↓
  Failures accumulate
    ↓
OPEN (Fail Fast)
    ↓
  Wait timeout period
    ↓
HALF_OPEN (Testing)
    ↓
  Successes accumulate → CLOSED
  Failures → OPEN
```

### State Transitions

**CLOSED → OPEN:**
- After `failureThreshold` consecutive failures
- All requests fail immediately
- No calls to downstream service

**OPEN → HALF_OPEN:**
- After `timeout` duration
- Limited requests allowed through
- Testing if service recovered

**HALF_OPEN → CLOSED:**
- After `successThreshold` consecutive successes
- Resume normal operation

**HALF_OPEN → OPEN:**
- Any failure during testing
- Back to fail-fast mode

## Examples

### Example 1: Multiple Circuit Breakers

Different services need different thresholds:

```agentic
// Critical service - fail fast
@circuit_breaker(
  failureThreshold: 3,   // Open after 3 failures
  timeout: 30s            // Short timeout
)
@confidence(0.93)
func callCriticalService() -> Result<Response, Error> {
  // Fast failure detection
}

// Less critical service - more tolerant
@circuit_breaker(
  failureThreshold: 10,  // Open after 10 failures
  timeout: 5m             // Longer timeout
)
@confidence(0.88)
func callBestEffortService() -> Result<Response, Error> {
  // More patient with failures
}
```

### Example 2: With Fallback

Combine circuit breaker with fallback logic:

```agentic
@circuit_breaker(failureThreshold: 5, timeout: 60s)
@confidence(0.90)
func fetchDataWithFallback(key: string) -> Result<Data, Error> {
  // Try primary API
  primaryAPI.fetch(key) match {
    Ok(data) -> return Ok(data),
    Err(e) if circuitBreaker.isOpen() -> {
      // Circuit open - use fallback immediately
      @trace_decision("circuit_open_fallback", {
        service: "primary_api",
        fallback: "cache"
      })
      return cache.get(key) or Err(Error.ALL_SOURCES_FAILED)
    },
    Err(e) -> {
      // Circuit closed/half-open but request failed
      // Try fallback
      return cache.get(key) or Err(e)
    }
  }
}
```

### Example 3: Per-User Circuit Breakers

Isolate failures per user:

```agentic
@circuit_breaker_per_user(
  failureThreshold: 5,
  timeout: 60s
)
@confidence(0.87)
func userSpecificOperation(userId: string, data: Data) -> Result<Output, Error> {
  // Each user gets their own circuit breaker
  // One user's failures don't affect others

  circuitBreaker = CircuitBreakerRegistry.get(userId)

  if circuitBreaker.isOpen() {
    return Err(Error.CIRCUIT_OPEN {
      message: "Too many failures for this user",
      retryAfter: circuitBreaker.getRetryAfter()
    })
  }

  return processData(data)
}
```

### Example 4: Graceful Degradation

Return degraded service instead of total failure:

```agentic
@circuit_breaker(failureThreshold: 5, timeout: 60s)
@confidence(0.89)
func getRecommendations(userId: string) -> Result<Recommendations, Error> {
  // Try ML-powered recommendations
  mlAPI.getRecommendations(userId) match {
    Ok(recs) -> return Ok(recs),
    Err(e) if circuitBreaker.isOpen() -> {
      // Fallback to rule-based recommendations
      @degraded_service
      ruleBasedRecs = getRuleBasedRecommendations(userId)

      return Ok(Recommendations {
        items: ruleBasedRecs,
        source: "rule_based",
        degraded: true
      })
    },
    Err(e) -> return Err(e)
  }
}
```

## Monitoring

### Circuit Breaker Metrics

```agentic
@confidence(0.94)
func getCircuitBreakerMetrics(service: string) -> CircuitBreakerMetrics {
  cb = CircuitBreakerRegistry.get(service)

  return CircuitBreakerMetrics {
    state: cb.getState(),           // CLOSED, OPEN, HALF_OPEN
    failureCount: cb.getFailureCount(),
    successCount: cb.getSuccessCount(),
    lastFailureAt: cb.getLastFailureTime(),
    lastSuccessAt: cb.getLastSuccessTime(),
    timesOpened: cb.getTotalOpenCount(),
    averageRecoveryTime: cb.getAverageRecoveryTime(),
    requestsBlocked: cb.getBlockedRequestCount()
  }
}
```

### Dashboard

```agentic
@confidence(0.91)
func renderCircuitBreakerDashboard() -> Dashboard {
  services = ["primary_api", "payment_gateway", "analytics", "recommendations"]

  data = services.map(service => {
    metrics = getCircuitBreakerMetrics(service)

    return {
      service: service,
      status: metrics.state,
      health: metrics.state == "CLOSED" ? "healthy" : "degraded",
      failures: metrics.failureCount,
      uptime: calculateUptime(metrics)
    }
  })

  return Dashboard { services: data, timestamp: now() }
}
```

## Advanced Configuration

### Sliding Window

Track failures over time window, not just consecutive:

```agentic
@circuit_breaker(
  failureThreshold: 5,
  slidingWindow: 100,  // Last 100 requests
  timeout: 60s
)
@confidence(0.89)
func smartCircuitBreaker() -> Result<Output, Error> {
  // Opens if 5 failures in last 100 requests
  // More resilient to occasional failures
}
```

### Custom Health Check

Define custom logic for half-open state:

```agentic
@circuit_breaker(
  failureThreshold: 5,
  timeout: 60s,
  healthCheck: customHealthCheck
)
@confidence(0.87)
func withCustomHealth() -> Result<Output, Error> {
  // Uses custom health check instead of actual requests
}

func customHealthCheck() -> bool {
  // Ping endpoint, check metrics, etc.
  return api.ping().ok
}
```

## Best Practices

### 1. Set Appropriate Thresholds

```agentic
// ✓ Good: Balanced thresholds
@circuit_breaker(
  failureThreshold: 5,   // Not too sensitive
  successThreshold: 2,   // Not too slow to recover
  timeout: 60s           // Reasonable wait
)

// ✗ Bad: Too sensitive
@circuit_breaker(
  failureThreshold: 1,   // Opens after single failure
  timeout: 10s           // Tests too frequently
)
```

### 2. Always Have Fallback

```agentic
// ✓ Good: Graceful degradation
if circuitBreaker.isOpen() {
  return cache.get(key) or defaultValue
}

// ✗ Bad: Total failure
if circuitBreaker.isOpen() {
  throw Error("Service unavailable")  // Poor UX
}
```

### 3. Monitor and Alert

```agentic
// Alert when circuit opens
@on_circuit_open
func alertTeam(service: string) {
  @alert("critical", {
    message: "Circuit breaker opened for ${service}",
    action: "investigate_service_health"
  })
}
```

## Testing

### Test Circuit Breaker Behavior

```agentic
@test
@confidence(0.92)
func testCircuitBreakerOpens() {
  cb = CircuitBreaker(failureThreshold: 3, timeout: 60s)

  // Simulate failures
  for i in 0..3 {
    cb.recordFailure()
  }

  // Circuit should be open
  expect(cb.getState()).toBe("OPEN")

  // Subsequent requests should fail fast
  result = cb.call(() => apiRequest())
  expect(result).toBe(Err(CircuitBreakerError.CIRCUIT_OPEN))
}

@test
@confidence(0.90)
func testCircuitBreakerRecovers() {
  cb = CircuitBreaker(
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 1s  // Short for testing
  )

  // Open the circuit
  for i in 0..3 { cb.recordFailure() }

  // Wait for timeout
  sleep(1s)

  // Should be half-open
  expect(cb.getState()).toBe("HALF_OPEN")

  // Record successes
  cb.recordSuccess()
  cb.recordSuccess()

  // Should be closed
  expect(cb.getState()).toBe("CLOSED")
}
```

## Common Issues

### Issue: Circuit Opens Too Frequently

**Symptom:** Circuit breaker opens even during normal operation

**Causes:**
- Threshold too low
- Transient network issues counted as failures
- No retry logic before circuit breaker

**Solution:**
```agentic
// Add retry before circuit breaker
@retry(maxAttempts: 3, backoff: "exponential")
@circuit_breaker(failureThreshold: 10)  // Increased threshold
```

### Issue: Circuit Never Recovers

**Symptom:** Once open, stays open indefinitely

**Causes:**
- Service genuinely down
- Health check not working
- Timeout too short

**Solution:**
- Increase timeout
- Implement proper health check
- Add manual override

## See Also

- [Retry Logic Recipe](./retry-logic.md)
- [Graceful Degradation](./graceful-degradation.md)
- [Health Checks](../patterns/health-checks.md)
- [Resilience Patterns](../../advanced/resilience.md)

---

**Pro Tip:** Combine circuit breaker with retry and fallback for maximum resilience!
