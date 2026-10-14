import { BatchedWindowCheckpoint } from "./batched-window-checkpoint.js";

/** A rule a batched window checkpoint must pass. Check returns its problems, or none. */
export interface BatchedWindowCheckpointRule {
  check(item: BatchedWindowCheckpoint): string[];
}

export class BatchedWindowCheckpointCodeLengthRule implements BatchedWindowCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedWindowCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedWindowCheckpointTitleLengthRule implements BatchedWindowCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedWindowCheckpoint): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedWindowCheckpointRequiredTitleRule implements BatchedWindowCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedWindowCheckpoint): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched window checkpoint. */
export class BatchedWindowCheckpointValidator {
  rules: BatchedWindowCheckpointRule[];

  constructor(rules: BatchedWindowCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedWindowCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedWindowCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedWindowCheckpoint[]): Map<string, string[]> {
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

export function defaultBatchedWindowCheckpointValidator(): BatchedWindowCheckpointValidator {
  return new BatchedWindowCheckpointValidator(
    [
      new BatchedWindowCheckpointCodeLengthRule(64),
      new BatchedWindowCheckpointTitleLengthRule(255),
      new BatchedWindowCheckpointRequiredTitleRule("batched window checkpoint needs an entry"),
    ],
  );
}
