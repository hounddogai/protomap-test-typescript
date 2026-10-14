import { ScheduledCohortBatch } from "./scheduled-cohort-batch.js";

/** A rule a scheduled cohort batch must pass. Check returns its problems, or none. */
export interface ScheduledCohortBatchRule {
  check(item: ScheduledCohortBatch): string[];
}

export class ScheduledCohortBatchCodeLengthRule implements ScheduledCohortBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledCohortBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledCohortBatchCodePrefixRule implements ScheduledCohortBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledCohortBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledCohortBatchNameLengthRule implements ScheduledCohortBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledCohortBatch): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledCohortBatchWeightRangeRule implements ScheduledCohortBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledCohortBatch): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a scheduled cohort batch. */
export class ScheduledCohortBatchValidator {
  rules: ScheduledCohortBatchRule[];

  constructor(rules: ScheduledCohortBatchRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledCohortBatch): string[] {
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

  requireValid(item: ScheduledCohortBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledCohortBatch[]): Map<string, string[]> {
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

export function defaultScheduledCohortBatchValidator(): ScheduledCohortBatchValidator {
  return new ScheduledCohortBatchValidator(
    [
      new ScheduledCohortBatchCodeLengthRule(120),
      new ScheduledCohortBatchCodePrefixRule("ACM"),
      new ScheduledCohortBatchNameLengthRule(32),
      new ScheduledCohortBatchWeightRangeRule(5.7, 4950.8),
    ],
  );
}
