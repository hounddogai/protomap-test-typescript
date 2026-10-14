import { BatchedExitRuleRecord } from "./batched-exit-rule-record.js";

/** A rule a batched exit rule record must pass. Check returns its problems, or none. */
export interface BatchedExitRuleRecordRule {
  check(item: BatchedExitRuleRecord): string[];
}

export class BatchedExitRuleRecordDurationMinutesRangeRule implements BatchedExitRuleRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedExitRuleRecord): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedExitRuleRecordPinnedGuardRule implements BatchedExitRuleRecordRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BatchedExitRuleRecord): string[] {
    if (item.pinned && item.durationMinutes > this.limit) return [`duration minutes ${item.durationMinutes} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class BatchedExitRuleRecordLabelLengthRule implements BatchedExitRuleRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedExitRuleRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched exit rule record. */
export class BatchedExitRuleRecordValidator {
  rules: BatchedExitRuleRecordRule[];

  constructor(rules: BatchedExitRuleRecordRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedExitRuleRecord): string[] {
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

  requireValid(item: BatchedExitRuleRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedExitRuleRecord[]): Map<string, string[]> {
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

export function defaultBatchedExitRuleRecordValidator(): BatchedExitRuleRecordValidator {
  return new BatchedExitRuleRecordValidator(
    [
      new BatchedExitRuleRecordDurationMinutesRangeRule(16, 86400),
      new BatchedExitRuleRecordPinnedGuardRule(80),
      new BatchedExitRuleRecordLabelLengthRule(3600),
    ],
  );
}
