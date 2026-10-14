import { PendingPostReview } from "./pending-post-review.js";

/** A rule a pending post review must pass. Check returns its problems, or none. */
export interface PendingPostReviewRule {
  check(item: PendingPostReview): string[];
}

export class PendingPostReviewPriorityRangeRule implements PendingPostReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingPostReview): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingPostReviewRequiredCategoryRule implements PendingPostReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingPostReview): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class PendingPostReviewDurationMinutesRangeRule implements PendingPostReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingPostReview): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending post review. */
export class PendingPostReviewValidator {
  rules: PendingPostReviewRule[];

  constructor(rules: PendingPostReviewRule[]) {
    this.rules = rules;
  }

  validate(item: PendingPostReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingPostReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingPostReview[]): Map<string, string[]> {
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

export function defaultPendingPostReviewValidator(): PendingPostReviewValidator {
  return new PendingPostReviewValidator(
    [
      new PendingPostReviewPriorityRangeRule(1000, 3600),
      new PendingPostReviewRequiredCategoryRule("pending post review needs a value"),
      new PendingPostReviewDurationMinutesRangeRule(80, 1000),
    ],
  );
}
