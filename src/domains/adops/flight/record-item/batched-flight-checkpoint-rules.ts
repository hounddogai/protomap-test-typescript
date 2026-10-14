import { BatchedFlightCheckpoint } from "./batched-flight-checkpoint.js";

/** A rule a batched flight checkpoint must pass. Check returns its problems, or none. */
export interface BatchedFlightCheckpointRule {
  check(item: BatchedFlightCheckpoint): string[];
}

export class BatchedFlightCheckpointAmountRangeRule implements BatchedFlightCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedFlightCheckpoint): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedFlightCheckpointClicksRangeRule implements BatchedFlightCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedFlightCheckpoint): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedFlightCheckpointCodeLengthRule implements BatchedFlightCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedFlightCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedFlightCheckpointMaximumRangeRule implements BatchedFlightCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedFlightCheckpoint): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a batched flight checkpoint. */
export class BatchedFlightCheckpointValidator {
  rules: BatchedFlightCheckpointRule[];

  constructor(rules: BatchedFlightCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedFlightCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedFlightCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedFlightCheckpoint[]): Map<string, string[]> {
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

export function defaultBatchedFlightCheckpointValidator(): BatchedFlightCheckpointValidator {
  return new BatchedFlightCheckpointValidator(
    [
      new BatchedFlightCheckpointAmountRangeRule(3.7, 4001.7),
      new BatchedFlightCheckpointClicksRangeRule(120, 86400),
      new BatchedFlightCheckpointCodeLengthRule(32),
      new BatchedFlightCheckpointMaximumRangeRule(4.8, 2611.1),
    ],
  );
}
