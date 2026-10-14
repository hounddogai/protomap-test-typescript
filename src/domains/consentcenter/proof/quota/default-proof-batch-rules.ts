import * as text from "../../../../kit/text.js";
import { DefaultProofBatch } from "./default-proof-batch.js";

/** A rule a default proof batch must pass. Check returns its problems, or none. */
export interface DefaultProofBatchRule {
  check(item: DefaultProofBatch): string[];
}

export class DefaultProofBatchFrequencyCapRangeRule implements DefaultProofBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultProofBatch): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultProofBatchTimezoneLengthRule implements DefaultProofBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultProofBatch): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultProofBatchGraceDaysRangeRule implements DefaultProofBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultProofBatch): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultProofBatchActiveGuardRule implements DefaultProofBatchRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DefaultProofBatch): string[] {
    if (item.active && item.graceDays > this.limit) return [`grace days ${item.graceDays} exceeds ${this.limit} while active`];
    return [];
  }
}

export class DefaultProofBatchPriorityRangeRule implements DefaultProofBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultProofBatch): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultProofBatchAllowedTitleRule implements DefaultProofBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultProofBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is missing`];
    return [];
  }
}

/** Runs every rule of a default proof batch. */
export class DefaultProofBatchValidator {
  rules: DefaultProofBatchRule[];

  constructor(rules: DefaultProofBatchRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultProofBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultProofBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultProofBatch[]): Map<string, string[]> {
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

export function defaultDefaultProofBatchValidator(): DefaultProofBatchValidator {
  return new DefaultProofBatchValidator(
    [
      new DefaultProofBatchFrequencyCapRangeRule(1000, 86400),
      new DefaultProofBatchTimezoneLengthRule(64),
      new DefaultProofBatchGraceDaysRangeRule(16, 80),
      new DefaultProofBatchActiveGuardRule(80),
      new DefaultProofBatchPriorityRangeRule(16, 120),
      new DefaultProofBatchAllowedTitleRule(["global", "regional"]),
    ],
  );
}
