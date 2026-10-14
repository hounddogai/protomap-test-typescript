import * as text from "../../../../kit/text.js";
import { FunnelReview } from "./funnel-review.js";

/** A rule a funnel review must pass. Check returns its problems, or none. */
export interface FunnelReviewRule {
  check(item: FunnelReview): string[];
}

export class FunnelReviewAllowedLocaleRule implements FunnelReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FunnelReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is expired`];
    return [];
  }
}

export class FunnelReviewBidRangeRule implements FunnelReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelReview): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FunnelReviewStartsAtRangeRule implements FunnelReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelReview): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FunnelReviewRequiredTitleRule implements FunnelReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelReviewCurrencyLengthRule implements FunnelReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelReview): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelReviewNameLengthRule implements FunnelReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelReview): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a funnel review. */
export class FunnelReviewValidator {
  rules: FunnelReviewRule[];

  constructor(rules: FunnelReviewRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FunnelReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelReview[]): Map<string, string[]> {
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

export function defaultFunnelReviewValidator(): FunnelReviewValidator {
  return new FunnelReviewValidator(
    [
      new FunnelReviewAllowedLocaleRule([]),
      new FunnelReviewBidRangeRule(5.6, 2886.1),
      new FunnelReviewStartsAtRangeRule(16, 120),
      new FunnelReviewRequiredTitleRule("funnel review needs this field"),
      new FunnelReviewCurrencyLengthRule(3600),
      new FunnelReviewNameLengthRule(1000),
    ],
  );
}
