/**
 * Agentic Runtime Library
 * Provides runtime support for confidence tracking, context validation, etc.
 */

// Result type (Rust-like)
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// Result helper functions
export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok === true;
}

export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return result.ok === false;
}

export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  throw new Error(`Called unwrap on an Err value: ${JSON.stringify(result.error)}`);
}

export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.ok ? result.value : defaultValue;
}

export function unwrapOrElse<T, E>(result: Result<T, E>, fn: (error: E) => T): T {
  return result.ok ? result.value : fn(result.error);
}

export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? Ok(fn(result.value)) : result;
}

export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return result.ok ? result : Err(fn(result.error));
}

export function andThen<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  return result.ok ? fn(result.value) : result;
}

export function orElse<T, E, F>(result: Result<T, E>, fn: (error: E) => Result<T, F>): Result<T, F> {
  return result.ok ? result : fn(result.error);
}

// Confidence tracking
export interface ConfidenceMetadata {
  level: number; // 0.0 - 1.0
  reason?: string;
  timestamp: number;
}

class ConfidenceTracker {
  private confidenceMap = new Map<string, ConfidenceMetadata>();

  register(identifier: string, confidence: number, reason?: string) {
    this.confidenceMap.set(identifier, {
      level: confidence,
      reason,
      timestamp: Date.now(),
    });

    if (confidence < 0.80) {
      console.warn(
        `⚠️  Low confidence (${confidence.toFixed(2)}) in ${identifier}: ${reason || 'No reason provided'}`
      );
    }
  }

  get(identifier: string): ConfidenceMetadata | undefined {
    return this.confidenceMap.get(identifier);
  }

  all(): Record<string, ConfidenceMetadata> {
    return Object.fromEntries(this.confidenceMap);
  }
}

// Context validation
export interface ContextRequirement {
  name: string;
  type: string;
  required: boolean;
}

class ContextValidator {
  validate(requirements: ContextRequirement[], context: Record<string, any>): void {
    const missing: string[] = [];

    for (const req of requirements) {
      if (req.required && !(req.name in context)) {
        missing.push(req.name);
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `Missing required context: ${missing.join(', ')}\n` +
        `Required: ${requirements.map(r => r.name).join(', ')}\n` +
        `Available: ${Object.keys(context).join(', ')}`
      );
    }
  }
}

// Health check system
export type HealthStatus = 'OK' | 'DEGRADED' | 'FAILED';

export interface HealthCheck {
  name: string;
  check: () => Promise<HealthStatus> | HealthStatus;
  recovery?: () => Promise<void> | void;
  interval?: number; // milliseconds
}

class HealthCheckMonitor {
  private checks = new Map<string, HealthCheck>();
  private timers = new Map<string, NodeJS.Timeout>();

  register(check: HealthCheck) {
    this.checks.set(check.name, check);

    if (check.interval) {
      const timer = setInterval(async () => {
        await this.runCheck(check.name);
      }, check.interval);

      this.timers.set(check.name, timer);
    }
  }

  async runCheck(name: string): Promise<HealthStatus> {
    const check = this.checks.get(name);
    if (!check) {
      throw new Error(`Health check not found: ${name}`);
    }

    const status = await check.check();

    if (status === 'FAILED' && check.recovery) {
      console.warn(`Health check ${name} failed - attempting recovery`);
      try {
        await check.recovery();
        console.info(`Recovery successful for ${name}`);
      } catch (error) {
        console.error(`Recovery failed for ${name}:`, error);
      }
    }

    return status;
  }

  stopAll() {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
  }
}

// Global runtime instance
export class AgenticRuntime {
  static confidence = new ConfidenceTracker();
  static context = new ContextValidator();
  static health = new HealthCheckMonitor();

  // Decorator-like function for confidence tracking
  static withConfidence<T extends (...args: any[]) => any>(
    fn: T,
    confidence: number,
    reason?: string
  ): T {
    this.confidence.register(fn.name, confidence, reason);
    return fn;
  }

  // Decorator-like function for context validation
  static withContext<T extends (...args: any[]) => any>(
    fn: T,
    requirements: ContextRequirement[]
  ): T {
    return ((...args: any[]) => {
      const context = args[args.length - 1]; // Assume last arg is context
      this.context.validate(requirements, context);
      return fn(...args);
    }) as T;
  }

  // Helper for error recovery
  static async tryWithRecovery<T>(
    operation: () => Promise<T>,
    recovery: () => Promise<T>,
    maxAttempts = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt}/${maxAttempts} failed:`, error);

        if (attempt < maxAttempts) {
          console.info('Attempting recovery...');
          try {
            return await recovery();
          } catch (recoveryError) {
            console.warn('Recovery failed:', recoveryError);
          }
        }
      }
    }

    throw lastError;
  }
}

// Stage validation
export type Stage = 'stub' | 'partial' | 'complete';

export interface StageMetadata {
  stage: Stage;
  completionPercentage?: number;
  missingFeatures?: string[];
  knownIssues?: string[];
}

class StageValidator {
  private stageMap = new Map<string, StageMetadata>();

  register(identifier: string, metadata: StageMetadata) {
    this.stageMap.set(identifier, metadata);

    if (metadata.stage === 'stub') {
      console.warn(`⚠️  ${identifier} is a stub - not yet implemented`);
    } else if (metadata.stage === 'partial') {
      console.warn(
        `⚠️  ${identifier} is partially implemented (${metadata.completionPercentage || 0}%)` +
        (metadata.missingFeatures ? `\n   Missing: ${metadata.missingFeatures.join(', ')}` : '')
      );
    }
  }

  get(identifier: string): StageMetadata | undefined {
    return this.stageMap.get(identifier);
  }

  requireComplete(identifier: string): void {
    const metadata = this.stageMap.get(identifier);
    if (!metadata) {
      return; // No metadata = assume complete
    }

    if (metadata.stage !== 'complete') {
      throw new Error(
        `${identifier} is not complete (stage: ${metadata.stage})\n` +
        (metadata.missingFeatures ? `Missing: ${metadata.missingFeatures.join(', ')}` : '')
      );
    }
  }
}

// Validation utilities
export function validate<T>(
  value: T,
  predicate: (value: T) => boolean,
  errorMessage: string
): Result<T, string> {
  return predicate(value) ? Ok(value) : Err(errorMessage);
}

export function validateAll<T>(
  values: T[],
  predicate: (value: T) => boolean,
  errorMessage: string
): Result<T[], string> {
  const allValid = values.every(predicate);
  return allValid ? Ok(values) : Err(errorMessage);
}

// Retry utilities
export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<Result<T, Error>> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error = new Error('No attempts made');
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      return Ok(result);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        onRetry?.(attempt, lastError);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= backoffMultiplier;
      }
    }
  }

  return Err(lastError);
}

// Fallback chain
export function fallbackChain<T>(...fns: Array<() => Result<T, any>>): Result<T, Error[]> {
  const errors: Error[] = [];

  for (const fn of fns) {
    const result = fn();
    if (result.ok) {
      return result;
    }
    errors.push(
      result.error instanceof Error
        ? result.error
        : new Error(String(result.error))
    );
  }

  return Err(errors);
}

// Export convenience functions
export const confidence = AgenticRuntime.confidence;
export const contextValidator = AgenticRuntime.context;
export const healthMonitor = AgenticRuntime.health;
export const stageValidator = new StageValidator();