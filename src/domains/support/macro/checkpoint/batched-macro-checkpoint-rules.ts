import { BatchedMacroCheckpoint } from "./batched-macro-checkpoint.js";

/** A rule a batched macro checkpoint must pass. Check returns its problems, or none. */
export interface BatchedMacroCheckpointRule {
  check(item: BatchedMacroCheckpoint): string[];
}

export class BatchedMacroCheckpointLimitRangeRule implements BatchedMacroCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedMacroCheckpoint): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedMacroCheckpointChannelLengthRule implements BatchedMacroCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedMacroCheckpoint): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedMacroCheckpointRequiredSummaryRule implements BatchedMacroCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedMacroCheckpoint): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched macro checkpoint. */
export class BatchedMacroCheckpointValidator {
  rules: BatchedMacroCheckpointRule[];

  constructor(rules: BatchedMacroCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedMacroCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedMacroCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedMacroCheckpoint[]): Map<string, string[]> {
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

export function defaultBatchedMacroCheckpointValidator(): BatchedMacroCheckpointValidator {
  return new BatchedMacroCheckpointValidator(
    [
      new BatchedMacroCheckpointLimitRangeRule(16, 3600),
      new BatchedMacroCheckpointChannelLengthRule(255),
      new BatchedMacroCheckpointRequiredSummaryRule("batched macro checkpoint needs a value"),
    ],
  );
}
