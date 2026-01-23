# Recipe: LLM Cost Optimization

## Problem

Your AI application makes many LLM API calls, and costs are spiraling out of control. You need to optimize spending while maintaining quality.

## Solution

Use Agentic's cost tracking and optimization features:

```agentic
@cost_optimized(
  models: {
    cheap: { name: "gpt-4o-mini", cost_per_1k: 0.15 },
    standard: { name: "gpt-4o", cost_per_1k: 2.50 },
    premium: { name: "o1-pro", cost_per_1k: 15.00 }
  },
  quality_threshold: 0.85
)
@budget_limit(user_daily: 10.00, user_monthly: 200.00)
@confidence(0.88)
func generateContent(prompt: string, userId: string) -> Result<Content, Error> {
  // Check user budget
  budget = costRuntime.checkBudget(userId)

  if budget.remaining < 0.50 {
    return Err(BudgetError {
      message: "Insufficient budget remaining",
      remaining: budget.remaining,
      suggestion: "Upgrade plan or wait until tomorrow"
    })
  }

  // Try cheapest model first
  @llm_call(model: "gpt-4o-mini", max_tokens: 500)
  @cost_tracked(userId: userId, feature: "content_generation")
  result = llm.generate({
    system: "Generate high-quality content",
    user: prompt,
    temperature: 0.7
  })

  // If quality is insufficient, escalate to better model
  if result.confidence < 0.85 && budget.remaining > 2.00 {
    @llm_call(model: "gpt-4o", max_tokens: 500)
    @cost_tracked(userId: userId, feature: "content_generation_premium")
    result = llm.generate({
      system: "Generate high-quality content",
      user: prompt,
      temperature: 0.7
    })
  }

  return Ok(result)
}
```

## Discussion

### Cost Tracking

Agentic automatically tracks:
- **Per-user costs** (daily, monthly, lifetime)
- **Per-feature costs** (which features are expensive?)
- **Per-model costs** (which models are used most?)
- **Token usage** (input + output tokens)

### Budget Enforcement

Three enforcement modes:

1. **Throttle** - Slow down requests when approaching limit
2. **Reject** - Refuse requests when limit exceeded
3. **Notify** - Allow but alert user/admin

### Cost-Aware Routing

Automatically route to cheaper models when appropriate:

```agentic
@cost_router(
  simple_queries: "gpt-4o-mini",      // $0.15/1K tokens
  complex_queries: "gpt-4o",          // $2.50/1K tokens
  reasoning_tasks: "o1-pro"           // $15.00/1K tokens
)
@confidence(0.86)
func smartRoute(query: Query) -> Result<Response, Error> {
  complexity = assessComplexity(query)

  model = complexity match {
    "simple" -> "gpt-4o-mini",
    "complex" -> "gpt-4o",
    "reasoning" -> "o1-pro"
  }

  return generateWithModel(query, model)
}
```

## Examples

### Example 1: Tiered Pricing

```agentic
type UserTier = "free" | "pro" | "enterprise"

@budget_per_tier(
  free: 1.00,      // $1/day
  pro: 20.00,      // $20/day
  enterprise: 500.00  // $500/day
)
@confidence(0.91)
func generateForUser(prompt: string, user: User) -> Result<Content, Error> {
  budget = getBudgetForTier(user.tier)

  if getRemainingBudget(user.id) < budget * 0.1 {
    // Less than 10% budget remaining
    @notify_user("Approaching daily limit", {
      remaining: getRemainingBudget(user.id),
      total: budget
    })
  }

  return generate(prompt, user.id)
}
```

### Example 2: Batch Processing

Reduce costs by batching requests:

```agentic
@batch_optimization(
  maxBatchSize: 20,
  maxWaitTime: 5s
)
@confidence(0.90)
func batchGenerate(prompts: string[]) -> Result<Content[], Error> {
  // Combine multiple prompts into single LLM call
  // Reduces overhead and cost

  batchPrompt = prompts.map((p, i) =>
    `[Item ${i}]: ${p}`
  ).join("\n\n")

  @llm_call(model: "gpt-4o-mini", max_tokens: 2000)
  batchResult = llm.generate(batchPrompt)

  // Parse batch response
  results = splitBatchResponse(batchResult, prompts.length)

  return Ok(results)
}
```

### Example 3: Caching for Cost Reduction

```agentic
@cache(
  ttl: 1h,
  maxSize: 10000,
  keyGenerator: (prompt) => hash(prompt)
)
@confidence(0.92)
func cachedGenerate(prompt: string) -> Result<Content, Error> {
  // Check cache first (zero cost!)
  cached = cache.get(hash(prompt))

  if cached {
    @cost_saved(estimatedCost: 0.02)  // Would have cost $0.02
    return Ok(cached)
  }

  // Cache miss - call LLM
  @llm_call(model: "gpt-4o-mini")
  @cost_tracked(userId: "system", feature: "generation")
  result = llm.generate(prompt)

  // Store in cache
  cache.set(hash(prompt), result, ttl: 1h)

  return Ok(result)
}
```

### Example 4: Fallback to Cheaper Models

```agentic
@fallback_chain(
  primary: "gpt-4o",
  fallbacks: ["gpt-4o-mini", "cache", "default_response"]
)
@confidence(0.87)
func generateWithFallback(prompt: string, userId: string) -> Result<Content, Error> {
  budget = costRuntime.checkBudget(userId)

  // Try premium model if budget allows
  if budget.remaining > 2.00 {
    @llm_call(model: "gpt-4o")
    return llm.generate(prompt)
  }

  // Fallback to cheaper model
  if budget.remaining > 0.15 {
    @llm_call(model: "gpt-4o-mini")
    return llm.generate(prompt)
  }

  // Fallback to cache
  cached = cache.get(hash(prompt))
  if cached {
    return Ok(cached)
  }

  // Final fallback: default response
  return Ok(defaultResponse(prompt))
}
```

## Cost Analytics

### Generate Cost Reports

```agentic
@confidence(0.93)
func generateCostReport(userId: string, period: Period) -> CostReport {
  costs = costRuntime.getReport({
    userId: userId,
    period: period,
    groupBy: ["feature", "model", "date"]
  })

  return CostReport {
    total: costs.total,
    byFeature: costs.byFeature,
    byModel: costs.byModel,
    byDate: costs.byDate,
    recommendations: analyzeCosts(costs),
    potentialSavings: calculateSavings(costs)
  }
}
```

### Cost Optimization Recommendations

```typescript
function analyzeCosts(costs: CostData): string[] {
  const recommendations = [];

  // Check if using expensive models for simple tasks
  if (costs.byModel["o1-pro"] > costs.total * 0.5) {
    recommendations.push(
      "⚠️ 50%+ cost from o1-pro. Consider gpt-4o for simpler tasks."
    );
  }

  // Check cache hit rate
  const cacheHitRate = costs.cacheHits / (costs.cacheHits + costs.cacheMisses);
  if (cacheHitRate < 0.3) {
    recommendations.push(
      "💡 Low cache hit rate (30%). Increase cache TTL or size."
    );
  }

  // Check batch efficiency
  if (costs.batchedRequests / costs.totalRequests < 0.2) {
    recommendations.push(
      "💡 Only 20% of requests batched. Consider batch processing."
    );
  }

  return recommendations;
}
```

## Monitoring and Alerts

### Set Up Cost Alerts

```agentic
@alert_on_threshold(
  warning: 0.80,   // Alert at 80% budget
  critical: 0.95   // Critical alert at 95%
)
@confidence(0.94)
func monitorUserCosts(userId: string) -> void {
  budget = costRuntime.getBudget(userId)
  spent = costRuntime.getSpent(userId, period: "daily")

  percentage = spent / budget.daily

  if percentage >= 0.95 {
    @alert("critical", {
      message: "User ${userId} at 95% of daily budget",
      spent: spent,
      budget: budget.daily,
      action: "throttle_requests"
    })
  } else if percentage >= 0.80 {
    @alert("warning", {
      message: "User ${userId} at 80% of daily budget",
      spent: spent,
      budget: budget.daily,
      action: "notify_user"
    })
  }
}
```

## Best Practices

### 1. Start Cheap, Escalate When Needed

```agentic
// Always try cheapest option first
result = tryModel("gpt-4o-mini")

if result.confidence < threshold {
  result = tryModel("gpt-4o")  // Escalate if needed
}
```

### 2. Cache Aggressively

```agentic
// Cache common queries
// 1 hour TTL saves significant cost for repeated requests
@cache(ttl: 1h)
```

### 3. Batch When Possible

```agentic
// Instead of 100 individual calls ($2.50)
// Make 1 batch call ($0.25) - 10x savings
```

### 4. Monitor and Optimize

```agentic
// Review cost reports weekly
// Identify expensive features
// Optimize high-cost operations
```

## Real-World Savings

### Case Study: Startup Reduces Costs 80%

**Before:**
- 10,000 LLM calls/day
- All using GPT-4
- Cost: $250/day = $7,500/month

**After Optimization:**
- 70% simple queries → gpt-4o-mini ($0.15/1K)
- 25% complex queries → gpt-4o ($2.50/1K)
- 5% reasoning tasks → o1-pro ($15/1K)
- 30% cache hit rate (zero cost)
- Cost: $50/day = $1,500/month

**Savings: $6,000/month (80% reduction)**

### Case Study: Enterprise Controls Runaway Costs

**Problem:** Some users were generating $100+/day in costs

**Solution:**
```agentic
@budget_limit(user_daily: 20.00, action: "throttle")
```

**Result:**
- Costs capped at $20/user/day
- High-volume users upgraded to enterprise plans
- Average cost per user: $3/day (down from $15/day)

---

## See Also

- [Budget Enforcement](./budget-enforcement.md)
- [Caching Strategies](../patterns/caching.md)
- [Batch Processing](../patterns/batching.md)
- [LLM Integration Guide](./llm-integration.md)

---

**Pro Tip:** Run `agentic cost-analysis` monthly to identify optimization opportunities!
