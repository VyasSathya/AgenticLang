# Agentic Cookbook

Practical recipes for common programming patterns in Agentic.

## Error Handling

- [Graceful Degradation](./error-handling/graceful-degradation.md) - Fallback chains for resilience
- [Retry Logic](./error-handling/retry-logic.md) - Auto-retry with exponential backoff
- [Circuit Breaker](./error-handling/circuit-breaker.md) - Prevent cascade failures
- [Error Recovery Blocks](./error-handling/recovery-blocks.md) - Rich error context

## Confidence Management

- [Tracking Uncertainty](./confidence/tracking-uncertainty.md) - When to use @uncertain
- [Confidence Chains](./confidence/propagation.md) - Propagating through calls
- [Improving Confidence](./confidence/improvement.md) - Refactoring strategies
- [Human Review Triggers](./confidence/human-review.md) - Flagging for review

## Testing

- [Property-Based Testing](./testing/property-based.md) - Writing @property annotations
- [Custom Test Generators](./testing/custom-arbitraries.md) - Domain-specific test data
- [Integration Testing](./testing/integration.md) - End-to-end tests
- [Mutation Testing](./testing/mutation.md) - Validating test quality

## Patterns

- [Dependency Injection](./patterns/dependency-injection.md) - Using @needs effectively
- [Incremental Development](./patterns/incremental-dev.md) - @stub → @partial → @complete
- [Session Handoffs](./patterns/session-handoff.md) - AI collaboration
- [Self-Healing](./patterns/self-healing.md) - Health checks and recovery

## Real-World Examples

- [REST API](./real-world/web-api.md) - Building HTTP services
- [Database Operations](./real-world/database.md) - Safe data access
- [Authentication](./real-world/authentication.md) - Auth flows with confidence
- [Background Jobs](./real-world/background-jobs.md) - Async task processing
- [Multi-Agent System](./real-world/multi-agent.md) - Agent coordination

## Multi-Agent Coordination

- [Message Passing](./multi-agent/message-passing.md) - Channel-based communication
- [Protocol Verification](./multi-agent/protocols.md) - Session types
- [Agent Orchestration](./multi-agent/orchestration.md) - Coordinating multiple agents
- [Handoff Protocol](./multi-agent/handoff.md) - Transferring context between agents

## AI-Specific

- [LLM Integration](./ai/llm-integration.md) - Calling language models
- [Cost Tracking](./ai/cost-tracking.md) - Managing API costs
- [Prompt Management](./ai/prompts.md) - Template-based prompts
- [Safety Guardrails](./ai/guardrails.md) - Input/output validation

## Contributing Recipes

Have a useful pattern? Contribute to the cookbook!

1. Fork the repository
2. Create a new recipe in the appropriate category
3. Follow the [recipe template](./TEMPLATE.md)
4. Submit a pull request

## Recipe Format

Each recipe follows this structure:

```markdown
# Recipe: [Problem Statement]

## Problem
What are you trying to solve?

## Solution
Agentic code example with annotations

## Discussion
Why this works, alternatives, trade-offs

## Variations
Different approaches to the same problem

## See Also
Related recipes and references
```

---

**Questions?** Join the discussion on [Discord #recipes channel](https://discord.gg/agentic)
