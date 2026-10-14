import { RetentionBatch } from "./retention-batch.js";

/** A rule a retention batch must pass. Check returns its problems, or none. */
export interface RetentionBatchRule {
  check(item: RetentionBatch): string[];
}

export class RetentionBatchRequiredContactEmailRule implements RetentionBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionBatch): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionBatchLabelLengthRule implements RetentionBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionBatch): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionBatchRequiredLabelRule implements RetentionBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionBatch): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionBatchAmountRangeRule implements RetentionBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionBatch): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a retention batch. */
export class RetentionBatchValidator {
  rules: RetentionBatchRule[];

  constructor(rules: RetentionBatchRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionBatch): string[] {
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

  requireValid(item: RetentionBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionBatch[]): Map<string, string[]> {
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

export function defaultRetentionBatchValidator(): RetentionBatchValidator {
  return new RetentionBatchValidator(
    [
      new RetentionBatchRequiredContactEmailRule("retention batch needs this field"),
      new RetentionBatchLabelLengthRule(80),
      new RetentionBatchRequiredLabelRule("retention batch needs this field"),
      new RetentionBatchAmountRangeRule(4.6, 3211.6),
    ],
  );
}
