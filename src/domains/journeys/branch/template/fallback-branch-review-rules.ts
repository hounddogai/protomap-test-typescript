import { FallbackBranchReview } from "./fallback-branch-review.js";

/** A rule a fallback branch review must pass. Check returns its problems, or none. */
export interface FallbackBranchReviewRule {
  check(item: FallbackBranchReview): string[];
}

export class FallbackBranchReviewThresholdRangeRule implements FallbackBranchReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackBranchReview): string[] {
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

export class FallbackBranchReviewCodeLengthRule implements FallbackBranchReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackBranchReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackBranchReviewRequiredNameRule implements FallbackBranchReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackBranchReview): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback branch review. */
export class FallbackBranchReviewValidator {
  rules: FallbackBranchReviewRule[];

  constructor(rules: FallbackBranchReviewRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackBranchReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackBranchReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackBranchReview[]): Map<string, string[]> {
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

export function defaultFallbackBranchReviewValidator(): FallbackBranchReviewValidator {
  return new FallbackBranchReviewValidator(
    [
      new FallbackBranchReviewThresholdRangeRule(1.6, 2847.9),
      new FallbackBranchReviewCodeLengthRule(255),
      new FallbackBranchReviewRequiredNameRule("fallback branch review needs this field"),
    ],
  );
}
