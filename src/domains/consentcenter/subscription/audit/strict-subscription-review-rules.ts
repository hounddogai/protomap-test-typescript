import * as text from "../../../../kit/text.js";
import { StrictSubscriptionReview } from "./strict-subscription-review.js";

/** A rule a strict subscription review must pass. Check returns its problems, or none. */
export interface StrictSubscriptionReviewRule {
  check(item: StrictSubscriptionReview): string[];
}

export class StrictSubscriptionReviewRequiredLabelRule implements StrictSubscriptionReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictSubscriptionReview): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StrictSubscriptionReviewAllowedCategoryRule implements StrictSubscriptionReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictSubscriptionReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is duplicated`];
    return [];
  }
}

export class StrictSubscriptionReviewLabelLengthRule implements StrictSubscriptionReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictSubscriptionReview): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict subscription review. */
export class StrictSubscriptionReviewValidator {
  rules: StrictSubscriptionReviewRule[];

  constructor(rules: StrictSubscriptionReviewRule[]) {
    this.rules = rules;
  }

  validate(item: StrictSubscriptionReview): string[] {
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

  requireValid(item: StrictSubscriptionReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictSubscriptionReview[]): Map<string, string[]> {
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

export function defaultStrictSubscriptionReviewValidator(): StrictSubscriptionReviewValidator {
  return new StrictSubscriptionReviewValidator(
    [
      new StrictSubscriptionReviewRequiredLabelRule("strict subscription review needs an entry"),
      new StrictSubscriptionReviewAllowedCategoryRule(["tiered", "regional", "adaptive"]),
      new StrictSubscriptionReviewLabelLengthRule(32),
    ],
  );
}
