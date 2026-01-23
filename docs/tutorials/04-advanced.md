# Tutorial 4: Advanced Agentic

**Level:** Advanced
**Time:** 2 hours
**Prerequisites:** [Tutorial 3: Intermediate](./03-intermediate.md)

## What You'll Learn

- Self-healing systems with health checks
- Formal verification with Z3
- Lean4 theorem proving
- Advanced multi-agent patterns
- Production deployment strategies
- Performance optimization

## Self-Healing Systems

### Health Checks with Auto-Recovery

Build systems that monitor and heal themselves:

```agentic
@healthcheck(interval: 30s)
@confidence(0.94)
@complete
func checkDatabaseHealth() -> HealthStatus {
  try {
    @timeout(5s)
    database.ping()

    return HealthStatus.OK
  } catch {
    @trace_health_failure("database_ping_failed", {
      timestamp: now(),
      lastSuccess: lastSuccessfulPing
    })

    return HealthStatus.FAILED
  }
}

@recovery(for: checkDatabaseHealth, maxAttempts: 3)
@confidence(0.87)
func healDatabase() -> Result<void, RecoveryError> {
  logger.warn("🏥 Database health check failed, attempting recovery...")

  // Strategy 1: Reconnect
  @attempt(1)
  database.reconnect() match {
    Ok(_) -> {
      logger.info("✓ Database reconnected successfully")
      return Ok(void)
    },
    Err(e) -> {
      logger.warn("✗ Reconnection failed: ${e}")
    }
  }

  // Strategy 2: Restart connection pool
  @attempt(2)
  database.restartPool() match {
    Ok(_) -> {
      logger.info("✓ Connection pool restarted")
      return Ok(void)
    },
    Err(e) -> {
      logger.error("✗ Pool restart failed: ${e}")
    }
  }

  // Strategy 3: Escalate to human
  @attempt(3)
  @escalate_to_human({
    severity: "critical",
    system: "database",
    message: "Database cannot be recovered automatically",
    context: { attempts: 3, errors: collectErrors() },
    oncall: ["database_team", "devops_team"]
  })

  return Err(RecoveryError.ESCALATED_TO_HUMAN)
}
```

### Multi-Level Health Monitoring

```agentic
@confidence(0.91)
@complete
func systemHealth() -> SystemHealthReport {
  checks = [
    ("database", checkDatabaseHealth()),
    ("redis", checkRedisHealth()),
    ("external_api", checkExternalAPIHealth()),
    ("disk_space", checkDiskSpace()),
    ("memory", checkMemoryUsage())
  ]

  failed = checks.filter(([name, status]) => status == HealthStatus.FAILED)
  degraded = checks.filter(([name, status]) => status == HealthStatus.DEGRADED)

  overall = failed.length match {
    0 if degraded.length == 0 -> HealthStatus.OK,
    0 if degraded.length > 0 -> HealthStatus.DEGRADED,
    _ -> HealthStatus.FAILED
  }

  return SystemHealthReport {
    overall: overall,
    checks: checks,
    timestamp: now(),
    recommendations: generateRecommendations(failed, degraded)
  }
}
```

## Formal Verification with Z3

### Writing Contracts

Define mathematical contracts for your functions:

```agentic
@verify(solver: "z3", timeout: 5s)
@requires(a >= 0 && b >= 0)
@ensures(result >= a && result >= b)
@confidence(0.99)
@complete
func max(a: number, b: number) -> number {
  return a > b ? a : b
}
// Compiler: ✓ PROVEN by Z3 in 0.015s
```

### Advanced Contracts

```agentic
@verify(solver: "z3")
@contract {
  requires: {
    array_not_empty: "arr.length > 0",
    valid_index: "index >= 0 && index < arr.length"
  },
  ensures: {
    returns_element: "result == arr[index]",
    no_modification: "arr.length == old(arr.length)"
  },
  invariants: {
    array_unchanged: "arr == old(arr)"
  }
}
@confidence(0.98)
@complete
func getElement<T>(arr: T[], index: number) -> T {
  return arr[index]
}
```

### Counterexample-Guided Refinement

When verification fails, Z3 provides counterexamples:

```agentic
@verify(solver: "z3")
@requires(x > 0)
@ensures(result > 0)
@confidence(0.90)
func problemat ic(x: number) -> number {
  return x - 1  // ✗ FAILED: Z3 found counterexample: x=1 → result=0
}

// Fix based on counterexample:
@verify(solver: "z3")
@requires(x > 1)  // ← Strengthened precondition
@ensures(result > 0)
@confidence(0.99)
func fixed(x: number) -> number {
  return x - 1  // ✓ PROVEN
}
```

## Lean4 Theorem Proving

### Exporting to Lean4

For highest assurance, export critical functions to Lean4:

```bash
agentic export --target lean4 crypto.agentic --output crypto.lean
```

Generated Lean4:

```lean
def encrypt (plaintext : String) (key : String) : String :=
  sorry  -- Implementation

theorem encrypt_correctness (plaintext : String) (key : String) :
  decrypt (encrypt plaintext key) key = plaintext := by
  sorry  -- Proof obligation

-- Prove the theorem interactively in Lean4
```

### Interactive Proof Development

```lean
-- Agentic generates the theorem statement
-- You complete the proof in Lean4

theorem safeDivide_correct (a b : ℝ) (h : b ≠ 0) :
  ∃ result, result = a / b := by
  use a / b
  -- Lean4 automatically proves this
  field_simp [h]
```

### AI-Assisted Proof Generation

```agentic
@verify(solver: "lean4", ai_assist: true)
@confidence(0.96)
func cryptographicHash(input: string) -> string {
  // Agentic + Claude/GPT-4 generate proof together
  // Uses LLM fine-tuned on Coq/Lean datasets
}
```

## Advanced Multi-Agent Patterns

### Hierarchical Agent System

```agentic
@agent(role: "supervisor")
agent SupervisorAgent {
  workers: Agent[]

  @confidence(0.89)
  func delegateTask(task: Task) -> Result<Output, Error> {
    // Select best worker based on capabilities
    worker = selectWorker(task, self.workers)

    // Delegate with monitoring
    @timeout(task.estimatedDuration * 1.5)
    @requires_approval(if: task.riskLevel == "high")
    result = worker.execute(task) match {
      Ok(output) -> output,
      Err(error) -> {
        // Try another worker
        backup = selectBackupWorker(task, self.workers, exclude: [worker])
        return backup.execute(task)
      }
    }

    return Ok(result)
  }
}

@agent(role: "worker")
agent WorkerAgent {
  capabilities: string[]

  @confidence(0.85)
  @session_aware
  func execute(task: Task) -> Result<Output, Error> {
    @checkpoint("start")

    if !self.canHandle(task) {
      @handoff {
        to: "supervisor",
        reason: "Task requires capabilities I don't have",
        context: { task, myCapabilities: self.capabilities }
      }
      return Err(Error.CANNOT_HANDLE)
    }

    @checkpoint("processing")
    output = processTask(task)

    @checkpoint("complete")
    return Ok(output)
  }
}
```

### Consensus Pattern

Multiple agents vote on decisions:

```agentic
@confidence(0.88)
@complete
@property("requires majority agreement")
func consensusDecision(
  question: Question,
  agents: Agent[],
  quorum: number = 0.5
) -> Result<Decision, ConsensusError> {
  if agents.length < 3 {
    return Err(ConsensusError.INSUFFICIENT_AGENTS)
  }

  // Collect votes in parallel
  @parallel(maxConcurrency: agents.length)
  votes = agents.map(agent => agent.vote(question))

  // Tally results
  tallied = tallyVotes(votes)

  majority = tallied.max()

  if majority.count / agents.length < quorum {
    return Err(ConsensusError.NO_CONSENSUS {
      votes: tallied,
      quorum: quorum
    })
  }

  @trace_decision("consensus_reached", {
    decision: majority.decision,
    voteCount: majority.count,
    confidence: majority.count / agents.length
  })

  return Ok(majority.decision)
}
```

### Agent Auction Pattern

Agents bid on tasks based on their confidence:

```agentic
@confidence(0.86)
func auctionTask(task: Task, agents: Agent[]) -> Result<Agent, AuctionError> {
  // Request bids
  bids = agents.map(agent => {
    bid = agent.bidOnTask(task)
    return {
      agent: agent,
      confidence: bid.confidence,
      estimatedTime: bid.estimatedTime,
      estimatedCost: bid.estimatedCost
    }
  })

  // Select winner (highest confidence × lowest cost)
  winner = bids.maxBy(bid =>
    bid.confidence / (bid.estimatedCost + 0.01)
  )

  if winner.confidence < 0.70 {
    @escalate_to_human("No agent confident enough for this task")
    return Err(AuctionError.CONFIDENCE_TOO_LOW)
  }

  return Ok(winner.agent)
}
```

## Production Deployment

### Blue-Green Deployment

```agentic
@confidence(0.91)
@effects(network, database, state)
@requires_approval(approvers: ["sre_team"])
func blueGreenDeploy(newVersion: Version) -> Result<Deployment, DeployError> {
  // Deploy to green environment
  @checkpoint("green_deploy")
  greenEnv = deployToGreen(newVersion) match {
    Ok(env) -> env,
    Err(e) -> {
      @rollback
      return Err(DeployError.GREEN_DEPLOY_FAILED(e))
    }
  }

  // Health check green
  @checkpoint("green_health")
  @timeout(5m)
  waitForHealthy(greenEnv) match {
    Ok(_) -> {},
    Err(e) -> {
      @rollback
      destroyEnvironment(greenEnv)
      return Err(DeployError.HEALTH_CHECK_FAILED(e))
    }
  }

  // Run smoke tests
  @checkpoint("smoke_tests")
  runSmokeTests(greenEnv) match {
    Ok(_) -> {},
    Err(e) -> {
      @rollback
      destroyEnvironment(greenEnv)
      return Err(DeployError.SMOKE_TESTS_FAILED(e))
    }
  }

  // Gradual traffic shift
  @checkpoint("traffic_shift")
  for percentage in [5, 25, 50, 75, 100] {
    shiftTraffic(greenEnv, percentage)

    @monitor(duration: 5m)
    metrics = monitorErrorRate(greenEnv)

    if metrics.errorRate > 0.01 {  // 1% error threshold
      @rollback
      shiftTraffic(blueEnv, 100)
      return Err(DeployError.EXCESSIVE_ERRORS {
        errorRate: metrics.errorRate,
        shiftedPercentage: percentage
      })
    }
  }

  // Success! Decommission blue
  @checkpoint("complete")
  decommissionBlue()

  return Ok(Deployment {
    version: newVersion,
    environment: greenEnv,
    timestamp: now()
  })
}
```

### Feature Flags

```agentic
@confidence(0.94)
@feature_flag("new_algorithm", rollout: 10%)
func processData(data: Data) -> Result<Output, Error> {
  algorithm = if featureEnabled("new_algorithm") {
    newAlgorithm  // Only 10% of traffic
  } else {
    oldAlgorithm  // 90% of traffic
  }

  return algorithm.process(data)
}
```

### Canary Deployment with Auto-Rollback

```agentic
@confidence(0.89)
@canary(percentage: 5%, duration: 10m, errorThreshold: 0.01)
func deployCanary(version: Version) -> Result<Deployment, Error> {
  // Deploy to 5% of traffic
  // Monitor for 10 minutes
  // Rollback automatically if error rate > 1%
  // Increase to 100% if successful
}
```

## Performance Optimization

### Zero-Cost Abstractions

```agentic
// Compile-time confidence tracking (zero runtime cost)
@confidence(0.95, mode: "compile_time")
@complete
func fastOperation(x: number) -> number {
  return x * 2
  // No runtime overhead - confidence stripped in production builds
}
```

### Inline Hints for Compiler

```agentic
@inline(always)
@confidence(0.99)
func smallHelper(x: number) -> number {
  return x + 1
  // Compiler inlines this function at call sites
}

@inline(never)
@confidence(0.85)
func largeFunction() -> Output {
  // Keep as function call (too large to inline)
}
```

### SIMD Optimization

```agentic
@simd(width: 4)
@confidence(0.92)
func vectorAdd(a: number[], b: number[]) -> number[] {
  // Compiler generates SIMD instructions for parallel addition
  return a.zip(b).map(([x, y]) => x + y)
}
```

## Practice Project: Build a Self-Healing Microservice

Build a production-grade microservice that:

### Requirements

1. **HTTP API** with authentication
   - JWT-based auth
   - Rate limiting
   - Error handling with recovery

2. **Database** with connection pooling
   - Transaction support
   - Health monitoring
   - Auto-reconnection

3. **Multi-Agent Processing**
   - Worker pool for parallel tasks
   - Supervisor for coordination
   - Handoff on failures

4. **Observability**
   - OpenTelemetry tracing
   - Metrics (Prometheus)
   - Structured logging

5. **Self-Healing**
   - Health checks every 30s
   - Auto-recovery strategies
   - Human escalation when needed

6. **Verification**
   - Property tests for all @complete functions
   - 90%+ mutation score
   - Z3 verification for critical paths
   - Statistical confidence monitoring

7. **Deployment**
   - Blue-green deployment
   - Canary releases
   - Auto-rollback on errors
   - Feature flags

### Architecture

```
┌─────────────────────────────────────────┐
│           Load Balancer                  │
└────────────┬────────────────────────────┘
             │
     ┌───────┴──────┐
     │              │
     ▼              ▼
┌─────────┐    ┌─────────┐
│  Blue   │    │ Green   │
│  v1.0   │    │  v1.1   │
└────┬────┘    └────┬────┘
     │              │
     └───────┬──────┘
             │
     ┌───────┴──────────┐
     │                  │
     ▼                  ▼
┌──────────┐      ┌──────────┐
│ Database │      │  Redis   │
│  Pool    │      │  Cache   │
└──────────┘      └──────────┘
     │                  │
     └────────┬─────────┘
              │
    ┌─────────┴─────────┐
    │  Health Monitor    │
    │  + Auto-Recovery   │
    └───────────────────┘
```

### Starter Template

See [examples/production-api.agentic](../../examples/production-api.agentic) for complete implementation.

## Key Takeaways

- ✅ Build self-healing systems with @healthcheck and @recovery
- ✅ Use formal verification (@verify, Z3) for critical code
- ✅ Export to Lean4 for highest assurance
- ✅ Implement multi-agent patterns (supervisor, consensus, auction)
- ✅ Deploy with confidence (blue-green, canary, feature flags)
- ✅ Optimize for production (inline, SIMD, zero-cost)

## Next Steps

- [Tutorial 5: Expert](./04-expert.md) - Contributing to Agentic itself
- [Production Deployment Guide](../guides/deployment.md)
- [Formal Verification Deep-Dive](../advanced/verification.md)
- [Multi-Agent Architectures](../advanced/multi-agent.md)

## Additional Resources

### Advanced Topics
- [Probabilistic Programming with Agentic](../advanced/probabilistic.md)
- [Distributed Tracing](../advanced/tracing.md)
- [Security Best Practices](../advanced/security.md)
- [Performance Tuning Guide](../advanced/performance.md)

### Research Papers
- [Verified Confidence: Statistical Validation of AI-Generated Code](papers/verified-confidence.pdf)
- [Session Types for Multi-Agent Systems](papers/session-types.pdf)
- [Effect Systems for AI Workloads](papers/effect-systems.pdf)

---

**Previous:** [← Intermediate](./03-intermediate.md) | **Next:** [Expert →](./05-expert.md)

**Ready for production deployment?** Join our [Discord #production channel](https://discord.gg/agentic) for support!
