import { BatchedApprovalReview } from "./batched-approval-review.js";

/** A rule a batched approval review must pass. Check returns its problems, or none. */
export interface BatchedApprovalReviewRule {
  check(item: BatchedApprovalReview): string[];
}

export class BatchedApprovalReviewDiscountRangeRule implements BatchedApprovalReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedApprovalReview): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedApprovalReviewRequiredCodeRule implements BatchedApprovalReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedApprovalReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedApprovalReviewTitleLengthRule implements BatchedApprovalReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedApprovalReview): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedApprovalReviewUpdatedAtRangeRule implements BatchedApprovalReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedApprovalReview): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedApprovalReviewBudgetRangeRule implements BatchedApprovalReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedApprovalReview): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedApprovalReviewDurationMinutesRangeRule implements BatchedApprovalReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedApprovalReview): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a batched approval review. */
export class BatchedApprovalReviewValidator {
  rules: BatchedApprovalReviewRule[];

  constructor(rules: BatchedApprovalReviewRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedApprovalReview): string[] {
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

  requireValid(item: BatchedApprovalReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedApprovalReview[]): Map<string, string[]> {
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

export function defaultBatchedApprovalReviewValidator(): BatchedApprovalReviewValidator {
  return new BatchedApprovalReviewValidator(
    [
      new BatchedApprovalReviewDiscountRangeRule(0.5, 2263.8),
      new BatchedApprovalReviewRequiredCodeRule("batched approval review needs a value"),
      new BatchedApprovalReviewTitleLengthRule(32),
      new BatchedApprovalReviewUpdatedAtRangeRule(120, 86400),
      new BatchedApprovalReviewBudgetRangeRule(0.6, 4380.6),
      new BatchedApprovalReviewDurationMinutesRangeRule(80, 1000),
    ],
  );
}
