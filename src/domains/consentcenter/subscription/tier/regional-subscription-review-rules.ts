import * as text from "../../../../kit/text.js";
import { RegionalSubscriptionReview } from "./regional-subscription-review.js";

/** A rule a regional subscription review must pass. Check returns its problems, or none. */
export interface RegionalSubscriptionReviewRule {
  check(item: RegionalSubscriptionReview): string[];
}

export class RegionalSubscriptionReviewGraceDaysRangeRule implements RegionalSubscriptionReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSubscriptionReview): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalSubscriptionReviewAllowedCodeRule implements RegionalSubscriptionReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalSubscriptionReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class RegionalSubscriptionReviewRequiredLabelRule implements RegionalSubscriptionReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSubscriptionReview): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional subscription review. */
export class RegionalSubscriptionReviewValidator {
  rules: RegionalSubscriptionReviewRule[];

  constructor(rules: RegionalSubscriptionReviewRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalSubscriptionReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalSubscriptionReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalSubscriptionReview[]): Map<string, string[]> {
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

export function defaultRegionalSubscriptionReviewValidator(): RegionalSubscriptionReviewValidator {
  return new RegionalSubscriptionReviewValidator(
    [
      new RegionalSubscriptionReviewGraceDaysRangeRule(16, 80),
      new RegionalSubscriptionReviewAllowedCodeRule(["primary"]),
      new RegionalSubscriptionReviewRequiredLabelRule("regional subscription review needs this field"),
    ],
  );
}
