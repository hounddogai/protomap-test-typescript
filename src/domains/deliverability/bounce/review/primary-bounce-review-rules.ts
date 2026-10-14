import { PrimaryBounceReview } from "./primary-bounce-review.js";

/** A rule a primary bounce review must pass. Check returns its problems, or none. */
export interface PrimaryBounceReviewRule {
  check(item: PrimaryBounceReview): string[];
}

export class PrimaryBounceReviewRequiredCohortRule implements PrimaryBounceReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryBounceReview): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryBounceReviewCeilingRangeRule implements PrimaryBounceReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryBounceReview): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryBounceReviewTitleLengthRule implements PrimaryBounceReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryBounceReview): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryBounceReviewCodeLengthRule implements PrimaryBounceReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryBounceReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryBounceReviewApprovedGuardRule implements PrimaryBounceReviewRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PrimaryBounceReview): string[] {
    if (item.approved && item.ceiling > this.limit) return [`ceiling ${item.ceiling} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a primary bounce review. */
export class PrimaryBounceReviewValidator {
  rules: PrimaryBounceReviewRule[];

  constructor(rules: PrimaryBounceReviewRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryBounceReview): string[] {
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

  requireValid(item: PrimaryBounceReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryBounceReview[]): Map<string, string[]> {
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

export function defaultPrimaryBounceReviewValidator(): PrimaryBounceReviewValidator {
  return new PrimaryBounceReviewValidator(
    [
      new PrimaryBounceReviewRequiredCohortRule("primary bounce review needs a value"),
      new PrimaryBounceReviewCeilingRangeRule(0.8, 2611.9),
      new PrimaryBounceReviewTitleLengthRule(1000),
      new PrimaryBounceReviewCodeLengthRule(64),
      new PrimaryBounceReviewApprovedGuardRule(9.6),
    ],
  );
}
