# Building Production Multi-Agent Systems with Agentic

**Part 4 of the Agentic Blog Series**

---

## The Multi-Agent Challenge

You've built one AI agent. Now you need five agents working together:
- **Coordinator** - Routes tasks
- **Analyst** - Analyzes data
- **Researcher** - Finds information
- **Writer** - Generates content
- **Reviewer** - Quality control

**How do they communicate? How do they coordinate? How do you prevent chaos?**

In frameworks like LangGraph or AutoGen, you write orchestration code. Lots of it.

**In Agentic, multi-agent coordination is built into the language.**

---

## Agent Types: A New Primitive

```agentic
@agent(role: "coordinator", capabilities: ["routing", "delegation"])
agent CoordinatorAgent {
  inbox: Channel<Task>
  outbox: Channel<Assignment>

  @handler("task_received")
  @confidence(0.88)
  func route(task: Task) -> Assignment {
    // Type-safe message handling
    // Automatic serialization
    // Built-in error handling
  }
}
```

**This is not a class. It's a language primitive.**

The compiler:
- ✅ Generates message serialization
- ✅ Creates inbox/outbox channels
- ✅ Validates message types
- ✅ Ensures handlers match message types
- ✅ Tracks agent lifecycle

---

## Session Types: Verified Protocols

Here's the killer feature: **session types**.

```agentic
@protocol(A2A)  // Agent-to-Agent
type TaskProcessingProtocol {
  // Protocol definition
  Coordinator -> Worker: TaskAssignment
  Worker -> Coordinator: Acknowledgment
  Worker -> Coordinator: Progress (0..n times)
  Worker -> Coordinator: Result
  close
}

@implements(TaskProcessingProtocol)
agent WorkerAgent {
  // Compiler verifies protocol compliance!
}
```

**If an agent violates the protocol, compilation fails.**

This is cutting-edge research (PLDI 2025) in production code.

---

## Real Example: Content Generation Pipeline

```agentic
@workflow(persistent: true, resumable: true)
@confidence(0.86)
func contentPipeline(topic: string) -> Result<Article, Error> {
  // Spawn specialized agents
  researcher = spawn ResearcherAgent()
  outliner = spawn OutlinerAgent()
  writer = spawn WriterAgent()
  reviewer = spawn ReviewerAgent()

  // Step 1: Research
  @checkpoint("research")
  @budget_limit(feature_max: 2.00)
  researcher.inbox.send(ResearchRequest {
    topic: topic,
    depth: "comprehensive"
  })

  @timeout(5m)
  research = researcher.outbox.receive() match {
    Some(r) -> r,
    None -> {
      @handoff {
        to: "human_researcher",
        reason: "Automated research timed out",
        context: { topic, elapsed: 5m }
      }
      return Err(Error.RESEARCH_TIMEOUT)
    }
  }

  // Step 2: Create outline
  @checkpoint("outline")
  outliner.inbox.send(OutlineRequest {
    topic: topic,
    research: research.findings
  })

  outline = outliner.outbox.receive()

  // Step 3: Write content
  @checkpoint("writing")
  @budget_limit(feature_max: 5.00)
  writer.inbox.send(WriteRequest {
    outline: outline,
    research: research.findings,
    tone: "professional",
    length: 2000
  })

  draft = writer.outbox.receive()

  // Step 4: Review and revise
  @checkpoint("review")
  reviewer.inbox.send(ReviewRequest {
    content: draft.text,
    criteria: ["accuracy", "clarity", "completeness"]
  })

  review = reviewer.outbox.receive()

  // Step 5: Revise if needed
  if review.score < 0.85 {
    @checkpoint("revision")
    writer.inbox.send(ReviseRequest {
      draft: draft.text,
      feedback: review.comments
    })

    final = writer.outbox.receive()
  } else {
    final = draft
  }

  @checkpoint("complete")

  return Ok(Article {
    title: final.title,
    content: final.text,
    metadata: {
      topic: topic,
      researchSources: research.sources.length,
      revisions: review.score < 0.85 ? 1 : 0,
      totalCost: getTotalCost(),
      confidence: final.confidence
    }
  })
}
```

**This handles:**
- Multi-agent coordination
- Checkpoints (can resume if interrupted)
- Timeouts and fallbacks
- Cost tracking per agent
- Quality control with revision loop
- Full observability

**In LangGraph, this is 300+ lines. In Agentic, it's 60 lines.**

---

## Consensus and Voting

Multiple agents reach agreement:

```agentic
@confidence(0.88)
func decideByConsensus(
  question: Decision,
  agents: Agent[],
  quorum: number = 0.67
) -> Result<Answer, ConsensusError> {
  // Each agent votes
  @parallel
  votes = agents.map(agent => agent.vote(question))

  // Tally results
  tally = countVotes(votes)

  // Require quorum (67% agreement)
  winner = tally.max()

  if winner.percentage < quorum {
    // No consensus - escalate
    @escalate_to_human({
      question: question,
      votes: tally,
      message: "Agents cannot reach consensus"
    })

    return Err(ConsensusError.NO_CONSENSUS)
  }

  @trace_decision("consensus_reached", {
    decision: winner.answer,
    agreementPercentage: winner.percentage,
    dissenting: agents.length - winner.count
  })

  return Ok(winner.answer)
}
```

**Use for:**
- Critical decisions
- Reducing single-agent bias
- Redundancy for reliability

---

## Auction-Based Task Allocation

Agents bid on tasks based on their confidence:

```agentic
@confidence(0.86)
func auctionTask(task: Task, agents: Agent[]) -> Result<Agent, Error> {
  // Request bids from all agents
  @parallel(timeout: 5s)
  bids = agents.map(agent =>
    agent.bidOnTask(task)  // Each agent returns confidence + cost
  )

  // Filter low-confidence bids
  qualified = bids.filter(bid => bid.confidence >= 0.75)

  if qualified.length == 0 {
    @escalate_to_human("No agent confident enough")
    return Err(Error.NO_QUALIFIED_AGENT)
  }

  // Select best bid (highest confidence / cost ratio)
  winner = qualified.maxBy(bid =>
    bid.confidence / (bid.estimatedCost + 0.01)
  )

  @trace_decision("task_auctioned", {
    winner: winner.agent.id,
    winningBid: winner.confidence,
    totalBidders: bids.length
  })

  return Ok(winner.agent)
}
```

---

## Supervision and Fault Tolerance

Supervisor restarts failed workers:

```agentic
@agent(role: "supervisor")
agent SupervisorAgent {
  workers: Agent[]
  restartPolicy: "always" | "on_failure" | "never"

  @confidence(0.87)
  func supervise() -> void {
    loop {
      // Monitor worker health
      for worker in self.workers {
        if worker.isFailed() {
          @trace_event("worker_failed", {
            workerId: worker.id,
            reason: worker.getFailureReason()
          })

          self.restartPolicy match {
            "always" -> self.restartWorker(worker),
            "on_failure" -> {
              if worker.isRestartable() {
                self.restartWorker(worker)
              }
            },
            "never" -> {
              @alert("critical", "Worker ${worker.id} failed and won't restart")
            }
          }
        }
      }

      sleep(10s)
    }
  }

  @confidence(0.85)
  func restartWorker(worker: Agent) -> Result<Agent, Error> {
    logger.info("🔄 Restarting worker: ${worker.id}")

    // Preserve state if possible
    state = worker.getState()

    // Stop old worker
    worker.stop()

    // Spawn new worker with same config
    newWorker = spawn WorkerAgent(config: worker.config)

    // Restore state
    if state {
      newWorker.setState(state)
    }

    // Replace in worker list
    self.workers = self.workers.map(w =>
      w.id == worker.id ? newWorker : w
    )

    logger.info("✓ Worker restarted: ${newWorker.id}")

    return Ok(newWorker)
  }
}
```

---

## Production Lessons

### Lesson 1: Always Use Timeouts

```agentic
// ✓ Good
@timeout(30s)
result = agent.outbox.receive()

// ✗ Bad
result = agent.outbox.receive()  // Could wait forever!
```

### Lesson 2: Buffer Your Channels

```agentic
// Unbuffered (synchronous)
inbox: Channel<Message>(capacity: 0)  // Send blocks until receive

// Buffered (async, better for production)
inbox: Channel<Message>(capacity: 100)  // Send doesn't block
```

### Lesson 3: Implement Backpressure

```agentic
@backpressure(maxQueueSize: 1000)
func handleMessage(msg: Message) -> Response {
  if inbox.size() > 1000 {
    return Response.RATE_LIMITED
  }

  // Process message
}
```

### Lesson 4: Monitor Everything

```agentic
@trace_agent_metrics({
  messageRate: true,
  errorRate: true,
  latency: true,
  queueDepth: true
})
agent ProductionAgent {
  // Automatic metrics collection
}
```

---

## The Bottom Line

**Multi-agent systems are hard in other languages.**

In Agentic:
- Agents are language primitives
- Channels are type-safe
- Protocols are verified at compile-time
- Sessions are persistent by default
- Handoffs are structured
- Everything is traceable

**It just works.**

---

## Try It

```bash
# Install
npm install -g agentic-lang

# Run multi-agent example
agentic compile examples/multi-agent-example.agentic
node examples/multi-agent-example.js
```

Or try in the [playground](https://agentic-lang.org/playground) (click "Multi-Agent" example).

---

**Resources:**
- [Multi-Agent Cookbook](https://agentic-lang.org/docs/cookbook/multi-agent)
- [Session Types Guide](https://agentic-lang.org/docs/advanced/session-types)
- [Agent Patterns](https://agentic-lang.org/docs/patterns/agents)

**Join the discussion:** [Discord #multi-agent](https://discord.gg/agentic)

---

**That's the series!** Thanks for reading.

**Next:** Start building with [Agentic tutorials](https://agentic-lang.org/docs/tutorials/01-hello-world)
