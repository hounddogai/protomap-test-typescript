import { BidRuleReview } from "./bid-rule-review.js";

/** A rule a bid rule review must pass. Check returns its problems, or none. */
export interface BidRuleReviewRule {
  check(item: BidRuleReview): string[];
}

export class BidRuleReviewVisibleGuardRule implements BidRuleReviewRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BidRuleReview): string[] {
    if (item.visible && item.minimum > this.limit) return [`minimum ${item.minimum} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class BidRuleReviewRevisionRangeRule implements BidRuleReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleReview): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BidRuleReviewTitleLengthRule implements BidRuleReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleReview): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a bid rule review. */
export class BidRuleReviewValidator {
  rules: BidRuleReviewRule[];

  constructor(rules: BidRuleReviewRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleReview): string[] {
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

  requireValid(item: BidRuleReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleReview[]): Map<string, string[]> {
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

export function defaultBidRuleReviewValidator(): BidRuleReviewValidator {
  return new BidRuleReviewValidator(
    [
      new BidRuleReviewVisibleGuardRule(3.9),
      new BidRuleReviewRevisionRangeRule(16, 3600),
      new BidRuleReviewTitleLengthRule(120),
    ],
  );
}
