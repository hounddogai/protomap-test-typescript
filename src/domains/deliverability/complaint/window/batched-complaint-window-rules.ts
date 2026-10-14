import * as text from "../../../../kit/text.js";
import { BatchedComplaintWindow } from "./batched-complaint-window.js";

/** A rule a batched complaint window must pass. Check returns its problems, or none. */
export interface BatchedComplaintWindowRule {
  check(item: BatchedComplaintWindow): string[];
}

export class BatchedComplaintWindowRequiredUnitRule implements BatchedComplaintWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedComplaintWindow): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedComplaintWindowRequiredCodeRule implements BatchedComplaintWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedComplaintWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedComplaintWindowRequiredTitleRule implements BatchedComplaintWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedComplaintWindow): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedComplaintWindowImpressionsRangeRule implements BatchedComplaintWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedComplaintWindow): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedComplaintWindowUnitLengthRule implements BatchedComplaintWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedComplaintWindow): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedComplaintWindowAllowedSummaryRule implements BatchedComplaintWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedComplaintWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is out of range`];
    return [];
  }
}

/** Runs every rule of a batched complaint window. */
export class BatchedComplaintWindowValidator {
  rules: BatchedComplaintWindowRule[];

  constructor(rules: BatchedComplaintWindowRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedComplaintWindow): string[] {
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

  requireValid(item: BatchedComplaintWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedComplaintWindow[]): Map<string, string[]> {
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

export function defaultBatchedComplaintWindowValidator(): BatchedComplaintWindowValidator {
  return new BatchedComplaintWindowValidator(
    [
      new BatchedComplaintWindowRequiredUnitRule("batched complaint window needs an entry"),
      new BatchedComplaintWindowRequiredCodeRule("batched complaint window needs a value"),
      new BatchedComplaintWindowRequiredTitleRule("batched complaint window needs an entry"),
      new BatchedComplaintWindowImpressionsRangeRule(64, 1000),
      new BatchedComplaintWindowUnitLengthRule(1000),
      new BatchedComplaintWindowAllowedSummaryRule(["scheduled", "rolling"]),
    ],
  );
}
