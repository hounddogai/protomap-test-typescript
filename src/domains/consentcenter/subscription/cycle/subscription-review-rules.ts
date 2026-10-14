import { SubscriptionReview } from "./subscription-review.js";

/** A rule a subscription review must pass. Check returns its problems, or none. */
export interface SubscriptionReviewRule {
  check(item: SubscriptionReview): string[];
}

export class SubscriptionReviewLimitRangeRule implements SubscriptionReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionReview): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SubscriptionReviewCodeLengthRule implements SubscriptionReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionReviewCodePrefixRule implements SubscriptionReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SubscriptionReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a subscription review. */
export class SubscriptionReviewValidator {
  rules: SubscriptionReviewRule[];

  constructor(rules: SubscriptionReviewRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionReview[]): Map<string, string[]> {
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

export function defaultSubscriptionReviewValidator(): SubscriptionReviewValidator {
  return new SubscriptionReviewValidator(
    [
      new SubscriptionReviewLimitRangeRule(120, 255),
      new SubscriptionReviewCodeLengthRule(255),
      new SubscriptionReviewCodePrefixRule("Q"),
    ],
  );
}
