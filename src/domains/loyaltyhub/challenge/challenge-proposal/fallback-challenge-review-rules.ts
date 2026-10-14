import { FallbackChallengeReview } from "./fallback-challenge-review.js";

/** A rule a fallback challenge review must pass. Check returns its problems, or none. */
export interface FallbackChallengeReviewRule {
  check(item: FallbackChallengeReview): string[];
}

export class FallbackChallengeReviewRequiredSegmentRule implements FallbackChallengeReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackChallengeReview): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackChallengeReviewThresholdRangeRule implements FallbackChallengeReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackChallengeReview): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackChallengeReviewRequiredCodeRule implements FallbackChallengeReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackChallengeReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackChallengeReviewLabelLengthRule implements FallbackChallengeReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackChallengeReview): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackChallengeReviewCategoryLengthRule implements FallbackChallengeReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackChallengeReview): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback challenge review. */
export class FallbackChallengeReviewValidator {
  rules: FallbackChallengeReviewRule[];

  constructor(rules: FallbackChallengeReviewRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackChallengeReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackChallengeReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackChallengeReview[]): Map<string, string[]> {
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

export function defaultFallbackChallengeReviewValidator(): FallbackChallengeReviewValidator {
  return new FallbackChallengeReviewValidator(
    [
      new FallbackChallengeReviewRequiredSegmentRule("fallback challenge review needs a value"),
      new FallbackChallengeReviewThresholdRangeRule(1.1, 2006.3),
      new FallbackChallengeReviewRequiredCodeRule("fallback challenge review needs a value"),
      new FallbackChallengeReviewLabelLengthRule(32),
      new FallbackChallengeReviewCategoryLengthRule(32),
    ],
  );
}
