# Recipe: Graceful Degradation with Fallback Chains

## Problem

Your service depends on external APIs that may fail. You want to maintain functionality by falling back to alternative sources or cached data.

## Solution

```agentic
@confidence(0.92, "Multiple fallback strategies tested")
@complete
@property("tries all fallbacks before failing")
@property("returns cached data when all APIs fail")
func fetchUserProfile(userId: string) -> Result<Profile, Error> {
  // Try primary API first
  @confidence(0.85)
  primaryResult = primaryAPI.fetch(userId) match {
    Ok(profile) -> return Ok(profile),
    Err(e) -> {
      @context {
        what_failed: "Primary API",
        suggestions: ["Try backup API", "Check network connectivity"]
      }
      // Continue to fallback
    }
  }

  // Try backup API
  @confidence(0.80)
  backupResult = backupAPI.fetch(userId) match {
    Ok(profile) -> return Ok(profile),
    Err(e) -> {
      @context {
        what_failed: "Backup API",
        suggestions: ["Use cached version"]
      }
      // Continue to cache
    }
  }

  // Final fallback: cached version (may be stale)
  @confidence(0.60)
  @partial("Cached data may be outdated")
  cachedResult = cache.get("profile:" + userId) match {
    Some(profile) -> return Ok(profile),
    None -> {
      return Err(Error {
        message: "All sources failed and no cache available",
        code: "PROFILE_UNAVAILABLE"
      })
    }
  }
}
```

## Discussion

This pattern implements a cascading fallback chain with:

1. **Primary source** - Highest confidence, most up-to-date
2. **Backup source** - Slightly lower confidence, still reliable
3. **Cache fallback** - Lower confidence due to potential staleness
4. **Explicit failure** - Clear error when all options exhausted

The confidence levels decrease with each fallback, reflecting reduced data quality.

### When to Use

- External API dependencies
- Database read operations with replicas
- CDN content delivery
- Any multi-source data retrieval

### Trade-offs

**Pros:**
- Higher availability
- Better user experience
- Graceful failure handling

**Cons:**
- Potentially stale data from cache
- Added complexity
- More failure modes to test

## Variations

### With Timeout per Source

```agentic
@timeout(primary: 2s, backup: 5s, cache: 100ms)
func fetchWithTimeouts(userId: string) -> Result<Profile, Error> {
  // Each fallback has different timeout expectations
}
```

### With Circuit Breaker

```agentic
@circuit_breaker(failureThreshold: 5, timeout: 60s)
func fetchWithCircuitBreaker(userId: string) -> Result<Profile, Error> {
  // Skip failed sources temporarily
}
```

## See Also

- [Retry Logic Recipe](../error-handling/retry-logic.md)
- [Circuit Breaker Pattern](../error-handling/circuit-breaker.md)
- [Error Recovery Blocks](../../tutorials/03-intermediate.md#error-recovery)
