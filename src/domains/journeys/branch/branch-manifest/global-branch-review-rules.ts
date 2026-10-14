import { GlobalBranchReview } from "./global-branch-review.js";

/** A rule a global branch review must pass. Check returns its problems, or none. */
export interface GlobalBranchReviewRule {
  check(item: GlobalBranchReview): string[];
}

export class GlobalBranchReviewVariantLengthRule implements GlobalBranchReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalBranchReview): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalBranchReviewRequiredLocaleRule implements GlobalBranchReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalBranchReview): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalBranchReviewLabelLengthRule implements GlobalBranchReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalBranchReview): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global branch review. */
export class GlobalBranchReviewValidator {
  rules: GlobalBranchReviewRule[];

  constructor(rules: GlobalBranchReviewRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalBranchReview): string[] {
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

  requireValid(item: GlobalBranchReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalBranchReview[]): Map<string, string[]> {
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

export function defaultGlobalBranchReviewValidator(): GlobalBranchReviewValidator {
  return new GlobalBranchReviewValidator(
    [
      new GlobalBranchReviewVariantLengthRule(32),
      new GlobalBranchReviewRequiredLocaleRule("global branch review needs an entry"),
      new GlobalBranchReviewLabelLengthRule(80),
    ],
  );
}
