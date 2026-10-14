import { CohortBatch } from "./cohort-batch.js";

/** A rule a cohort batch must pass. Check returns its problems, or none. */
export interface CohortBatchRule {
  check(item: CohortBatch): string[];
}

export class CohortBatchNameLengthRule implements CohortBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortBatch): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortBatchExpiresAtRangeRule implements CohortBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortBatch): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CohortBatchThresholdRangeRule implements CohortBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortBatch): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a cohort batch. */
export class CohortBatchValidator {
  rules: CohortBatchRule[];

  constructor(rules: CohortBatchRule[]) {
    this.rules = rules;
  }

  validate(item: CohortBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CohortBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortBatch[]): Map<string, string[]> {
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

export function defaultCohortBatchValidator(): CohortBatchValidator {
  return new CohortBatchValidator(
    [
      new CohortBatchNameLengthRule(64),
      new CohortBatchExpiresAtRangeRule(32, 64),
      new CohortBatchThresholdRangeRule(2.4, 374.4),
    ],
  );
}
