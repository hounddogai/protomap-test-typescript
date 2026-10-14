import { BatchedDeflectionSummary } from "./batched-deflection-summary.js";

/** A rule a batched deflection summary must pass. Check returns its problems, or none. */
export interface BatchedDeflectionSummaryRule {
  check(item: BatchedDeflectionSummary): string[];
}

export class BatchedDeflectionSummaryRequiredCodeRule implements BatchedDeflectionSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedDeflectionSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedDeflectionSummaryAmountRangeRule implements BatchedDeflectionSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedDeflectionSummary): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedDeflectionSummaryTitleLengthRule implements BatchedDeflectionSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedDeflectionSummary): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched deflection summary. */
export class BatchedDeflectionSummaryValidator {
  rules: BatchedDeflectionSummaryRule[];

  constructor(rules: BatchedDeflectionSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedDeflectionSummary): string[] {
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

  requireValid(item: BatchedDeflectionSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedDeflectionSummary[]): Map<string, string[]> {
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

export function defaultBatchedDeflectionSummaryValidator(): BatchedDeflectionSummaryValidator {
  return new BatchedDeflectionSummaryValidator(
    [
      new BatchedDeflectionSummaryRequiredCodeRule("batched deflection summary needs this field"),
      new BatchedDeflectionSummaryAmountRangeRule(8.4, 3239.1),
      new BatchedDeflectionSummaryTitleLengthRule(255),
    ],
  );
}
