import * as text from "../../../../kit/text.js";
import { BatchedModelCheckpoint } from "./batched-model-checkpoint.js";

/** A rule a batched model checkpoint must pass. Check returns its problems, or none. */
export interface BatchedModelCheckpointRule {
  check(item: BatchedModelCheckpoint): string[];
}

export class BatchedModelCheckpointCodeLengthRule implements BatchedModelCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedModelCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedModelCheckpointCodePrefixRule implements BatchedModelCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedModelCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedModelCheckpointAllowedDescriptionRule implements BatchedModelCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedModelCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is expired`];
    return [];
  }
}

export class BatchedModelCheckpointPinnedGuardRule implements BatchedModelCheckpointRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BatchedModelCheckpoint): string[] {
    if (item.pinned && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class BatchedModelCheckpointRequiredDescriptionRule implements BatchedModelCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedModelCheckpoint): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedModelCheckpointPriorityRangeRule implements BatchedModelCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedModelCheckpoint): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a batched model checkpoint. */
export class BatchedModelCheckpointValidator {
  rules: BatchedModelCheckpointRule[];

  constructor(rules: BatchedModelCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedModelCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedModelCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedModelCheckpoint[]): Map<string, string[]> {
    const report = new Map<string, string[]>();
    for (const item of items) {
      const problems = this.validate(item);
      if (problems.length > 0) {
        report.set(item.code, problems);
      }
    }
    return report;
  }
}

export function defaultBatchedModelCheckpointValidator(): BatchedModelCheckpointValidator {
  return new BatchedModelCheckpointValidator(
    [
      new BatchedModelCheckpointCodeLengthRule(32),
      new BatchedModelCheckpointCodePrefixRule("X"),
      new BatchedModelCheckpointAllowedDescriptionRule(["primary"]),
      new BatchedModelCheckpointPinnedGuardRule(86400),
      new BatchedModelCheckpointRequiredDescriptionRule("batched model checkpoint needs a value"),
      new BatchedModelCheckpointPriorityRangeRule(32, 1000),
    ],
  );
}
