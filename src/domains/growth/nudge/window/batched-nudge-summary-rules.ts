import * as text from "../../../../kit/text.js";
import { BatchedNudgeSummary } from "./batched-nudge-summary.js";

/** A rule a batched nudge summary must pass. Check returns its problems, or none. */
export interface BatchedNudgeSummaryRule {
  check(item: BatchedNudgeSummary): string[];
}

export class BatchedNudgeSummaryLabelLengthRule implements BatchedNudgeSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedNudgeSummary): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedNudgeSummaryBatchSizeRangeRule implements BatchedNudgeSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedNudgeSummary): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedNudgeSummaryAllowedSourceRule implements BatchedNudgeSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedNudgeSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a batched nudge summary. */
export class BatchedNudgeSummaryValidator {
  rules: BatchedNudgeSummaryRule[];

  constructor(rules: BatchedNudgeSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedNudgeSummary): string[] {
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

  requireValid(item: BatchedNudgeSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedNudgeSummary[]): Map<string, string[]> {
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

export function defaultBatchedNudgeSummaryValidator(): BatchedNudgeSummaryValidator {
  return new BatchedNudgeSummaryValidator(
    [
      new BatchedNudgeSummaryLabelLengthRule(3600),
      new BatchedNudgeSummaryBatchSizeRangeRule(16, 16),
      new BatchedNudgeSummaryAllowedSourceRule([]),
    ],
  );
}
