import { BatchedRewardReview } from "./batched-reward-review.js";

/** A rule a batched reward review must pass. Check returns its problems, or none. */
export interface BatchedRewardReviewRule {
  check(item: BatchedRewardReview): string[];
}

export class BatchedRewardReviewCodeLengthRule implements BatchedRewardReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedRewardReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedRewardReviewRequiredExternalRefRule implements BatchedRewardReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedRewardReview): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedRewardReviewRequiredLabelRule implements BatchedRewardReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedRewardReview): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedRewardReviewRetriesRangeRule implements BatchedRewardReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedRewardReview): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a batched reward review. */
export class BatchedRewardReviewValidator {
  rules: BatchedRewardReviewRule[];

  constructor(rules: BatchedRewardReviewRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedRewardReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedRewardReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedRewardReview[]): Map<string, string[]> {
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

export function defaultBatchedRewardReviewValidator(): BatchedRewardReviewValidator {
  return new BatchedRewardReviewValidator(
    [
      new BatchedRewardReviewCodeLengthRule(32),
      new BatchedRewardReviewRequiredExternalRefRule("batched reward review needs this field"),
      new BatchedRewardReviewRequiredLabelRule("batched reward review needs this field"),
      new BatchedRewardReviewRetriesRangeRule(32, 255),
    ],
  );
}
