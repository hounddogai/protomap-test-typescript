import { BranchReview } from "./branch-review.js";

/** A rule a branch review must pass. Check returns its problems, or none. */
export interface BranchReviewRule {
  check(item: BranchReview): string[];
}

export class BranchReviewCodeLengthRule implements BranchReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchReviewLabelLengthRule implements BranchReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchReview): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchReviewDiscountRangeRule implements BranchReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchReview): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BranchReviewRequiredCodeRule implements BranchReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a branch review. */
export class BranchReviewValidator {
  rules: BranchReviewRule[];

  constructor(rules: BranchReviewRule[]) {
    this.rules = rules;
  }

  validate(item: BranchReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BranchReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchReview[]): Map<string, string[]> {
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

export function defaultBranchReviewValidator(): BranchReviewValidator {
  return new BranchReviewValidator(
    [
      new BranchReviewCodeLengthRule(80),
      new BranchReviewLabelLengthRule(80),
      new BranchReviewDiscountRangeRule(4.9, 642.2),
      new BranchReviewRequiredCodeRule("branch review needs a value"),
    ],
  );
}
