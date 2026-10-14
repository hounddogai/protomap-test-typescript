import * as text from "../../../../kit/text.js";
import { BatchedDeflectionReview } from "./batched-deflection-review.js";

/** A rule a batched deflection review must pass. Check returns its problems, or none. */
export interface BatchedDeflectionReviewRule {
  check(item: BatchedDeflectionReview): string[];
}

export class BatchedDeflectionReviewLabelLengthRule implements BatchedDeflectionReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedDeflectionReview): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedDeflectionReviewRequiredCodeRule implements BatchedDeflectionReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedDeflectionReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedDeflectionReviewAllowedCodeRule implements BatchedDeflectionReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedDeflectionReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class BatchedDeflectionReviewFrequencyCapRangeRule implements BatchedDeflectionReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedDeflectionReview): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedDeflectionReviewDurationMinutesRangeRule implements BatchedDeflectionReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedDeflectionReview): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedDeflectionReviewUnitLengthRule implements BatchedDeflectionReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedDeflectionReview): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched deflection review. */
export class BatchedDeflectionReviewValidator {
  rules: BatchedDeflectionReviewRule[];

  constructor(rules: BatchedDeflectionReviewRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedDeflectionReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedDeflectionReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedDeflectionReview[]): Map<string, string[]> {
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

export function defaultBatchedDeflectionReviewValidator(): BatchedDeflectionReviewValidator {
  return new BatchedDeflectionReviewValidator(
    [
      new BatchedDeflectionReviewLabelLengthRule(80),
      new BatchedDeflectionReviewRequiredCodeRule("batched deflection review needs this field"),
      new BatchedDeflectionReviewAllowedCodeRule(["pending", "manual", "fallback"]),
      new BatchedDeflectionReviewFrequencyCapRangeRule(32, 32),
      new BatchedDeflectionReviewDurationMinutesRangeRule(80, 120),
      new BatchedDeflectionReviewUnitLengthRule(32),
    ],
  );
}
