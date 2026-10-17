# Recipe: Multi-Agent Message Passing

## Problem

You need multiple AI agents to collaborate on a task, passing messages between them safely and efficiently.

## Solution

Use Agentic's channel-based message passing (inspired by Go):

```agentic
@agent(role: "analyzer", capabilities: ["data_analysis"])
agent AnalyzerAgent {
  inbox: Channel<DataRequest>
  outbox: Channel<AnalysisResult>

  @handler("data_request")
  @confidence(0.88)
  func analyze(request: DataRequest) -> AnalysisResult {
    @trace_decision("analysis_approach", {
      dataSize: request.data.length,
      selectedMethod: "statistical_analysis"
    })

    insights = performAnalysis(request.data)

    return AnalysisResult {
      requestId: request.id,
      insights: insights,
      confidence: 0.88,
      timestamp: now()
    }
  }
}

@agent(role: "reporter", capabilities: ["report_generation"])
agent ReporterAgent {
  inbox: Channel<AnalysisResult>
  outbox: Channel<Report>

  @handler("analysis_result")
  @confidence(0.90)
  func generateReport(analysis: AnalysisResult) -> Report {
    report = createReport(analysis.insights)

    return Report {
      analysisId: analysis.requestId,
      content: report,
      generatedAt: now()
    }
  }
}

// Coordinator orchestrates the workflow
@confidence(0.85)
@session_aware
func processDataPipeline(data: Data) -> Result<Report, Error> {
  // Spawn agents
  analyzer = spawn AnalyzerAgent()
  reporter = spawn ReporterAgent()

  // Connect agents with channels
  pipeline = analyzer.outbox -> reporter.inbox

  // Send initial request
  analyzer.inbox.send(DataRequest {
    id: generateId(),
    data: data,
    priority: "normal"
  })

  // Wait for final output
  @timeout(60s)
  report = reporter.outbox.receive() match {
    Some(r) -> r,
    None -> return Err(Error.TIMEOUT)
  }

  return Ok(report)
}
```

## Discussion

### Why Channel-Based Communication?

**Advantages:**
- **Type-safe:** Channels are typed (Channel<MessageType>)
- **Decoupled:** Agents don't need direct references
- **Buffered:** Messages queue when receiver is busy
- **Async-safe:** Works with async/await naturally

**vs. Direct Function Calls:**
- ✅ Better for long-running operations
- ✅ Supports concurrent processing
- ✅ Natural backpressure handling
- ❌ Slightly more verbose

### Buffered vs Unbuffered Channels

**Unbuffered (capacity = 0):**
```agentic
channel = Channel<Message>(capacity: 0)
// Send blocks until receive happens
// Synchronous rendezvous
```

**Buffered (capacity > 0):**
```agentic
channel = Channel<Message>(capacity: 100)
// Send blocks only when buffer is full
// Async message queue
```

**When to use each:**
- **Unbuffered:** Strict synchronization, backpressure needed
- **Buffered:** Throughput optimization, burst handling

## Examples

### Example 1: Fan-Out Pattern

Distribute work to multiple workers:

```agentic
@confidence(0.87)
func parallelProcess(items: Data[]) -> Result<Output[], Error> {
  // Spawn 4 worker agents
  workers = [
    spawn WorkerAgent(),
    spawn WorkerAgent(),
    spawn WorkerAgent(),
    spawn WorkerAgent()
  ]

  // Create input/output channels
  inputChannel = Channel<Data>(capacity: 100)
  outputChannel = Channel<Output>(capacity: 100)

  // Connect workers
  for worker in workers {
    worker.inbox = inputChannel
    worker.outbox = outputChannel
  }

  // Send all items
  for item in items {
    inputChannel.send(item)
  }
  inputChannel.close()  // Signal end of input

  // Collect results
  results: Output[] = []
  for i in 0..items.length {
    result = outputChannel.receive() match {
      Some(r) -> r,
      None -> break
    }
    results.push(result)
  }

  return Ok(results)
}
```

### Example 2: Pipeline Pattern

Chain agents in sequence:

```agentic
@confidence(0.90)
func pipelineProcess(input: RawData) -> Result<FinalOutput, Error> {
  // Agent 1: Extract
  extractor = spawn ExtractorAgent()
  extracted = extractor.process(input)

  // Agent 2: Transform
  transformer = spawn TransformerAgent()
  transformed = transformer.process(extracted)

  // Agent 3: Load
  loader = spawn LoaderAgent()
  loaded = loader.process(transformed)

  return Ok(loaded)
}
```

### Example 3: Request-Response Pattern

```agentic
@agent(role: "service")
agent ServiceAgent {
  inbox: Channel<Request>
  outbox: Channel<Response>

  @handler("request")
  @confidence(0.86)
  func handleRequest(req: Request) -> Response {
    result = processRequest(req)

    return Response {
      requestId: req.id,
      result: result,
      timestamp: now()
    }
  }
}

// Client sends request and waits for response
@confidence(0.88)
func callService(request: Request) -> Result<Response, Error> {
  service = getOrSpawnService()

  // Send request
  service.inbox.send(request)

  // Wait for response with timeout
  @timeout(5s)
  response = service.outbox.receive() match {
    Some(resp) if resp.requestId == request.id -> resp,
    Some(_) -> return Err(Error.WRONG_RESPONSE),
    None -> return Err(Error.NO_RESPONSE)
  }

  return Ok(response)
}
```

## Advanced Patterns

### Select from Multiple Channels

Wait for first message from any channel (Go's select):

```agentic
@confidence(0.84)
@partial("Single channel only, full select not implemented")
func selectFromMany(channels: Channel<Message>[]) -> Result<Message, Error> {
  // Wait for first available message
  message = select(channels)

  return Ok(message)
}
```

### Timeout with Channels

```agentic
@confidence(0.89)
func receiveWithTimeout<T>(
  channel: Channel<T>,
  timeout: Duration
) -> Result<T, TimeoutError> {
  timeoutChannel = createTimeoutChannel(timeout)

  // Race between message and timeout
  select([channel, timeoutChannel]) match {
    FromChannel(0, message) -> return Ok(message),
    FromChannel(1, _) -> return Err(TimeoutError.TIMEOUT),
    _ -> return Err(TimeoutError.CHANNEL_CLOSED)
  }
}
```

### Broadcast to Multiple Agents

```agentic
@confidence(0.86)
func broadcast<T>(message: T, agents: Agent[]) -> Promise<void> {
  for agent in agents {
    agent.inbox.send(message)
  }
}
```

## Error Handling

### Channel Closed Error

```agentic
@confidence(0.91)
func safeSend<T>(channel: Channel<T>, message: T) -> Result<void, ChannelError> {
  if channel.isClosed() {
    return Err(ChannelError.CHANNEL_CLOSED)
  }

  try {
    channel.send(message)
    return Ok(void)
  } catch {
    return Err(ChannelError.SEND_FAILED)
  }
}
```

### Deadlock Prevention

```agentic
@confidence(0.83)
@uncertain("Deadlock detection not implemented yet")
@partial("Basic timeout, no cycle detection")
func sendWithTimeout<T>(
  channel: Channel<T>,
  message: T,
  timeout: Duration
) -> Result<void, Error> {
  @timeout(timeout)
  channel.send(message)

  return Ok(void)
}
```

## Testing Multi-Agent Systems

```agentic
@test
@confidence(0.89)
func testAgentCommunication() {
  // Create test agents with mock channels
  agent1 = createAgent("agent1")
  agent2 = createAgent("agent2")

  // Connect them
  agent1.outbox -> agent2.inbox

  // Send test message
  agent1.send("test_message", { data: "hello" })

  // Verify receipt
  @timeout(1s)
  received = agent2.inbox.receive()

  assert(received.data == "hello")
}
```

## Performance Considerations

**Buffered channels** are faster but use more memory:
- Small messages, high throughput → buffer size 1000+
- Large messages, low throughput → buffer size 10-100
- Strict ordering required → unbuffered (capacity 0)

**Channel cleanup:**
Always close channels when done to prevent memory leaks:

```agentic
@confidence(0.94)
func cleanupAgents(agents: Agent[]) {
  for agent in agents {
    agent.inbox.close()
    agent.outbox.close()
    agent.stop()
  }
}
```

## See Also

- [Agent Orchestration](./orchestration.md)
- [Handoff Protocol](./handoff.md)
- [Session Types](../advanced/session-types.md)
- [Concurrency Guide](../../guides/concurrency.md)

---

**Pro Tip:** Use `@trace_decision` to debug multi-agent workflows and see exactly what each agent is doing!
