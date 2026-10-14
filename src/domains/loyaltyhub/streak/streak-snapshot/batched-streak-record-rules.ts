import { BatchedStreakRecord } from "./batched-streak-record.js";

/** A rule a batched streak record must pass. Check returns its problems, or none. */
export interface BatchedStreakRecordRule {
  check(item: BatchedStreakRecord): string[];
}

export class BatchedStreakRecordRequiredCodeRule implements BatchedStreakRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedStreakRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedStreakRecordLabelLengthRule implements BatchedStreakRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedStreakRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedStreakRecordRequiredUtmSourceRule implements BatchedStreakRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedStreakRecord): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched streak record. */
export class BatchedStreakRecordValidator {
  rules: BatchedStreakRecordRule[];

  constructor(rules: BatchedStreakRecordRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedStreakRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedStreakRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedStreakRecord[]): Map<string, string[]> {
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

export function defaultBatchedStreakRecordValidator(): BatchedStreakRecordValidator {
  return new BatchedStreakRecordValidator(
    [
      new BatchedStreakRecordRequiredCodeRule("batched streak record needs this field"),
      new BatchedStreakRecordLabelLengthRule(32),
      new BatchedStreakRecordRequiredUtmSourceRule("batched streak record needs this field"),
    ],
  );
}
