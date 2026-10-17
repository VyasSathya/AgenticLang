/**
 * Multi-Agent Coordination Runtime
 * Implements session types, message passing, and coordination primitives
 */

import { Result } from './index';

// Channel for inter-agent communication
export class Channel<T> {
  private buffer: T[] = [];
  private capacity: number;
  private closed = false;
  private waitingReceivers: Array<(value: T | null) => void> = [];
  private waitingSenders: Array<{ value: T; resolve: () => void }> = [];

  constructor(capacity: number = 0) {
    this.capacity = capacity; // 0 = unbuffered
  }

  async send(value: T): Promise<void> {
    if (this.closed) {
      throw new Error('Cannot send on closed channel');
    }

    // If there's a waiting receiver, deliver directly
    if (this.waitingReceivers.length > 0) {
      const receiver = this.waitingReceivers.shift()!;
      receiver(value);
      return;
    }

    // If buffered and space available, add to buffer
    if (this.capacity > 0 && this.buffer.length < this.capacity) {
      this.buffer.push(value);
      return;
    }

    // Wait for receiver (unbuffered or buffer full)
    return new Promise<void>((resolve) => {
      this.waitingSenders.push({ value, resolve });
    });
  }

  async receive(): Promise<T | null> {
    if (this.closed && this.buffer.length === 0) {
      return null;
    }

    // If there's a waiting sender, receive directly
    if (this.waitingSenders.length > 0) {
      const { value, resolve } = this.waitingSenders.shift()!;
      resolve();
      return value;
    }

    // If buffer has data, return it
    if (this.buffer.length > 0) {
      return this.buffer.shift()!;
    }

    // Wait for sender
    return new Promise<T | null>((resolve) => {
      this.waitingReceivers.push(resolve);
    });
  }

  close(): void {
    this.closed = true;
    // Resolve all waiting receivers with null
    while (this.waitingReceivers.length > 0) {
      const receiver = this.waitingReceivers.shift()!;
      receiver(null);
    }
  }

  isClosed(): boolean {
    return this.closed;
  }
}

// Agent runtime
export interface AgentConfig {
  agentId: string;
  role: string;
  capabilities: string[];
  maxConcurrentTasks: number;
}

export class Agent {
  private inbox: Channel<any>;
  private outbox: Channel<any>;
  private handlers = new Map<string, (message: any) => Promise<any>>();
  private running = false;

  constructor(private config: AgentConfig) {
    this.inbox = new Channel(100); // Buffered inbox
    this.outbox = new Channel(100);
  }

  registerHandler(messageType: string, handler: (message: any) => Promise<any>): void {
    this.handlers.set(messageType, handler);
  }

  async start(): Promise<void> {
    this.running = true;

    while (this.running) {
      const message = await this.inbox.receive();

      if (message === null) {
        // Channel closed
        break;
      }

      const handler = this.handlers.get(message.type);

      if (handler) {
        try {
          const response = await handler(message.payload);
          await this.outbox.send({
            type: `${message.type}_response`,
            payload: response,
            requestId: message.id,
          });
        } catch (error) {
          await this.outbox.send({
            type: 'error',
            error: error instanceof Error ? error.message : String(error),
            requestId: message.id,
          });
        }
      }
    }
  }

  async stop(): Promise<void> {
    this.running = false;
    this.inbox.close();
    this.outbox.close();
  }

  async send(messageType: string, payload: any): Promise<void> {
    await this.outbox.send({
      type: messageType,
      payload,
      id: this.generateMessageId(),
      from: this.config.agentId,
      timestamp: Date.now(),
    });
  }

  getInbox(): Channel<any> {
    return this.inbox;
  }

  getOutbox(): Channel<any> {
    return this.outbox;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Session Manager
export class SessionManager {
  private sessions = new Map<string, SessionState>();

  async save(sessionId: string, state: SessionState): Promise<void> {
    this.sessions.set(sessionId, state);
    // TODO: Persist to storage (file, DB, S3)
  }

  async restore(sessionId: string): Promise<SessionState | null> {
    return this.sessions.get(sessionId) || null;
  }

  async checkpoint(sessionId: string, label: string, state: Record<string, any>): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.checkpoints.push({
      id: `checkpoint_${Date.now()}`,
      label,
      timestamp: Date.now(),
      state,
    });

    await this.save(sessionId, session);
  }

  async restoreCheckpoint(sessionId: string, checkpointId: string): Promise<Record<string, any>> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const checkpoint = session.checkpoints.find(c => c.id === checkpointId);

    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    return checkpoint.state;
  }
}

interface SessionState {
  sessionId: string;
  agentId: string;
  timestamp: number;
  state: Record<string, any>;
  checkpoints: Array<{
    id: string;
    label: string;
    timestamp: number;
    state: Record<string, any>;
  }>;
}

// Handoff Protocol
export class HandoffProtocol {
  async initiateHandoff(
    fromAgent: string,
    toAgent: string,
    reason: string,
    context: any
  ): Promise<Result<void, Error>> {
    const handoff = {
      fromAgent,
      toAgent,
      reason,
      context,
      timestamp: Date.now(),
      metadata: {
        conversationHistory: context.conversationHistory || [],
        confidenceHistory: context.confidenceHistory || [],
        intent: context.intent || '',
      },
    };

    // TODO: Send handoff to receiving agent
    // TODO: Wait for acknowledgment
    // TODO: Transfer session ownership

    return { ok: true, value: undefined };
  }

  async receiveHandoff(agentId: string): Promise<any | null> {
    // TODO: Check for pending handoffs to this agent
    // TODO: Return handoff context
    return null;
  }
}

// Approval Gate Runtime
export class ApprovalGateRuntime {
  async requestApproval(
    action: string,
    metadata: Record<string, any>,
    options: {
      channel: string;
      approvers: string[];
      timeout: number;
      fallback: 'approve' | 'reject';
    }
  ): Promise<Result<{ approved: boolean; reason?: string }, Error>> {
    console.log(`[APPROVAL REQUIRED] ${action}`);
    console.log(`  Metadata:`, metadata);
    console.log(`  Approvers:`, options.approvers);
    console.log(`  Timeout:`, options.timeout, 'ms');

    // TODO: Implement actual approval mechanism
    // For now, return fallback
    return {
      ok: true,
      value: {
        approved: options.fallback === 'approve',
        reason: 'Auto-decided by fallback policy',
      },
    };
  }
}

// Cost Tracker
export class CostTracker {
  private costs = new Map<string, number>();
  private budgets = new Map<string, { daily: number; monthly: number }>();

  trackCost(
    userId: string,
    cost: number,
    metadata: { feature?: string; model?: string }
  ): void {
    const key = `${userId}:${new Date().toISOString().split('T')[0]}`;
    const current = this.costs.get(key) || 0;
    this.costs.set(key, current + cost);

    console.log(`[COST] User ${userId}: +$${cost.toFixed(4)} (total: $${(current + cost).toFixed(4)})`);
  }

  setBudget(userId: string, daily: number, monthly: number): void {
    this.budgets.set(userId, { daily, monthly });
  }

  checkBudget(userId: string): { remaining: number; exceeded: boolean } {
    const key = `${userId}:${new Date().toISOString().split('T')[0]}`;
    const spent = this.costs.get(key) || 0;
    const budget = this.budgets.get(userId);

    if (!budget) {
      return { remaining: Infinity, exceeded: false };
    }

    const remaining = budget.daily - spent;
    return {
      remaining,
      exceeded: remaining <= 0,
    };
  }
}

// Export runtime instances
export const channelRuntime = {
  create: <T>(capacity: number = 0) => new Channel<T>(capacity),
};

export const agentRuntime = {
  spawn: (config: AgentConfig) => new Agent(config),
};

export const sessionRuntime = new SessionManager();
export const handoffRuntime = new HandoffProtocol();
export const approvalRuntime = new ApprovalGateRuntime();
export const costRuntime = new CostTracker();
