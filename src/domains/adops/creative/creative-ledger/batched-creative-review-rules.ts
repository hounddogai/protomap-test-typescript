import { BatchedCreativeReview } from "./batched-creative-review.js";

/** A rule a batched creative review must pass. Check returns its problems, or none. */
export interface BatchedCreativeReviewRule {
  check(item: BatchedCreativeReview): string[];
}

export class BatchedCreativeReviewUpdatedAtRangeRule implements BatchedCreativeReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedCreativeReview): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedCreativeReviewVariantLengthRule implements BatchedCreativeReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedCreativeReview): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedCreativeReviewTitleLengthRule implements BatchedCreativeReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedCreativeReview): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched creative review. */
export class BatchedCreativeReviewValidator {
  rules: BatchedCreativeReviewRule[];

  constructor(rules: BatchedCreativeReviewRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedCreativeReview): string[] {
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

  requireValid(item: BatchedCreativeReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedCreativeReview[]): Map<string, string[]> {
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

export function defaultBatchedCreativeReviewValidator(): BatchedCreativeReviewValidator {
  return new BatchedCreativeReviewValidator(
    [
      new BatchedCreativeReviewUpdatedAtRangeRule(64, 120),
      new BatchedCreativeReviewVariantLengthRule(1000),
      new BatchedCreativeReviewTitleLengthRule(120),
    ],
  );
}
