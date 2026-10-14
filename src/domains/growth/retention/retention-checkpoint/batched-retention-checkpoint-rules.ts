import { BatchedRetentionCheckpoint } from "./batched-retention-checkpoint.js";

/** A rule a batched retention checkpoint must pass. Check returns its problems, or none. */
export interface BatchedRetentionCheckpointRule {
  check(item: BatchedRetentionCheckpoint): string[];
}

export class BatchedRetentionCheckpointRateRangeRule implements BatchedRetentionCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedRetentionCheckpoint): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedRetentionCheckpointCodePrefixRule implements BatchedRetentionCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedRetentionCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedRetentionCheckpointRequiredCodeRule implements BatchedRetentionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedRetentionCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedRetentionCheckpointNotesLengthRule implements BatchedRetentionCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedRetentionCheckpoint): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedRetentionCheckpointCodeLengthRule implements BatchedRetentionCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedRetentionCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched retention checkpoint. */
export class BatchedRetentionCheckpointValidator {
  rules: BatchedRetentionCheckpointRule[];

  constructor(rules: BatchedRetentionCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedRetentionCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: BatchedRetentionCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedRetentionCheckpoint[]): Map<string, string[]> {
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

export function defaultBatchedRetentionCheckpointValidator(): BatchedRetentionCheckpointValidator {
  return new BatchedRetentionCheckpointValidator(
    [
      new BatchedRetentionCheckpointRateRangeRule(6.9, 1802.1),
      new BatchedRetentionCheckpointCodePrefixRule("ACM"),
      new BatchedRetentionCheckpointRequiredCodeRule("batched retention checkpoint needs an entry"),
      new BatchedRetentionCheckpointNotesLengthRule(3600),
      new BatchedRetentionCheckpointCodeLengthRule(120),
    ],
  );
}
