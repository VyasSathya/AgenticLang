/**
 * Extended Type System for Agentic
 * Includes session types, effect types, and multi-agent primitives
 */

import * as AST from './types';

// Session Types for Multi-Agent Protocols
export interface SessionType {
  kind: 'session';
  protocol: ProtocolDefinition;
}

export interface ProtocolDefinition {
  name: string;
  states: ProtocolState[];
  transitions: ProtocolTransition[];
  channels: Channel[];
}

export interface ProtocolState {
  name: string;
  isInitial: boolean;
  isFinal: boolean;
}

export interface ProtocolTransition {
  from: string;
  to: string;
  action: 'send' | 'receive';
  messageType: AST.TypeAnnotation;
  guard?: string; // Optional condition
}

export interface Channel {
  name: string;
  direction: 'input' | 'output' | 'bidirectional';
  messageType: AST.TypeAnnotation;
  buffered: boolean;
  capacity?: number;
}

// Agent Type Definition
export interface AgentType {
  type: 'AgentDeclaration';
  name: string;
  role: string;
  capabilities: string[];
  inbox: Channel;
  outbox: Channel;
  handlers: AgentHandler[];
}

export interface AgentHandler {
  messageType: string;
  handler: AST.FunctionDeclaration;
}

// Effect Types (track side effects)
export interface EffectType {
  kind: 'effect';
  effects: Effect[];
}

export type Effect =
  | 'io'
  | 'state'
  | 'async'
  | 'network'
  | 'database'
  | 'llm_call'
  | 'human_interaction'
  | 'file_system';

export interface FunctionSignatureWithEffects extends AST.FunctionDeclaration {
  effects?: Effect[];
  capabilities?: Capability[];
}

// Capability System (enhanced @needs)
export interface Capability {
  name: string;
  permissions: Permission[];
}

export type Permission = 'read' | 'write' | 'execute' | 'admin';

export interface CapabilityRequirement {
  capability: string;
  permissions: Permission[];
  scoped?: Record<string, any>; // e.g., { table: 'users' }
}

// Contract Types (Design by Contract)
export interface Contract {
  requires?: Precondition[];  // Preconditions
  ensures?: Postcondition[];  // Postconditions
  invariants?: Invariant[];   // Invariants
}

export interface Precondition {
  expression: string;
  description?: string;
}

export interface Postcondition {
  expression: string;
  description?: string;
}

export interface Invariant {
  expression: string;
  description?: string;
}

// Session Persistence
export interface SessionState {
  sessionId: string;
  agentId: string;
  timestamp: number;
  state: Record<string, any>;
  checkpoints: Checkpoint[];
  metadata: SessionMetadata;
}

export interface Checkpoint {
  id: string;
  label: string;
  timestamp: number;
  state: Record<string, any>;
}

export interface SessionMetadata {
  userId?: string;
  conversationHistory?: Message[];
  confidenceHistory?: number[];
  intent?: string;
  reasonForHandoff?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// Handoff Protocol
export interface AgentHandoff {
  fromAgent: string;
  toAgent: string;
  reason: string;
  context: HandoffContext;
  metadata: SessionMetadata;
}

export interface HandoffContext {
  conversationHistory: Message[];
  partialResults: Record<string, any>;
  intent: string;
  confidence: number;
  attemptedApproaches: string[];
}

// Workflow/State Machine Types
export interface WorkflowDefinition {
  name: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  checkpoints: string[];
  persistent: boolean;
  resumable: boolean;
}

export interface WorkflowState {
  name: string;
  handler: AST.FunctionDeclaration;
  annotations: AST.Annotation[];
}

export interface WorkflowTransition {
  from: string;
  to: string;
  event: string;
  condition?: string;
  maxAttempts?: number;
}

// Approval Gate Types
export interface ApprovalGate {
  channel: 'slack' | 'email' | 'webhook' | 'inline';
  approvers: string[];
  timeout: number; // milliseconds
  fallback: 'approve' | 'reject' | 'escalate';
  metadata: Record<string, any>;
}

export interface ApprovalDecision {
  approved: boolean;
  decision: 'approve' | 'edit' | 'reject';
  approver: string;
  timestamp: number;
  reason?: string;
  modifications?: Record<string, any>;
}

// Observability Types
export interface Trace {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  tags: Record<string, any>;
  logs: TraceLog[];
}

export interface TraceLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  fields: Record<string, any>;
}

export interface DecisionTrace {
  decisionId: string;
  timestamp: number;
  decision: string;
  alternatives: string[];
  reasoning: string;
  confidence: number;
  context: Record<string, any>;
}

// Cost Tracking Types
export interface CostMetadata {
  userId?: string;
  feature?: string;
  environment?: string;
  modelName?: string;
  tokenCount?: number;
  estimatedCost?: number;
}

export interface BudgetLimit {
  daily: number;
  monthly: number;
  action: 'throttle' | 'reject' | 'notify';
}
