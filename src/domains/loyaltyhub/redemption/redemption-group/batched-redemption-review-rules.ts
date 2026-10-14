import * as text from "../../../../kit/text.js";
import { BatchedRedemptionReview } from "./batched-redemption-review.js";

/** A rule a batched redemption review must pass. Check returns its problems, or none. */
export interface BatchedRedemptionReviewRule {
  check(item: BatchedRedemptionReview): string[];
}

export class BatchedRedemptionReviewScoreRangeRule implements BatchedRedemptionReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedRedemptionReview): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedRedemptionReviewNameLengthRule implements BatchedRedemptionReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedRedemptionReview): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedRedemptionReviewLabelLengthRule implements BatchedRedemptionReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedRedemptionReview): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedRedemptionReviewAllowedLocaleRule implements BatchedRedemptionReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedRedemptionReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is missing`];
    return [];
  }
}

export class BatchedRedemptionReviewRequiredUnitRule implements BatchedRedemptionReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedRedemptionReview): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched redemption review. */
export class BatchedRedemptionReviewValidator {
  rules: BatchedRedemptionReviewRule[];

  constructor(rules: BatchedRedemptionReviewRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedRedemptionReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedRedemptionReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedRedemptionReview[]): Map<string, string[]> {
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

export function defaultBatchedRedemptionReviewValidator(): BatchedRedemptionReviewValidator {
  return new BatchedRedemptionReviewValidator(
    [
      new BatchedRedemptionReviewScoreRangeRule(1.7, 4559.5),
      new BatchedRedemptionReviewNameLengthRule(16),
      new BatchedRedemptionReviewLabelLengthRule(16),
      new BatchedRedemptionReviewAllowedLocaleRule(["legacy", "regional", "capped"]),
      new BatchedRedemptionReviewRequiredUnitRule("batched redemption review needs an entry"),
    ],
  );
}
