import * as text from "../../../../kit/text.js";
import { StrictFrequencyReview } from "./strict-frequency-review.js";

/** A rule a strict frequency review must pass. Check returns its problems, or none. */
export interface StrictFrequencyReviewRule {
  check(item: StrictFrequencyReview): string[];
}

export class StrictFrequencyReviewTitleLengthRule implements StrictFrequencyReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictFrequencyReview): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictFrequencyReviewAllowedReviewerRule implements StrictFrequencyReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictFrequencyReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is below minimum`];
    return [];
  }
}

export class StrictFrequencyReviewCodeLengthRule implements StrictFrequencyReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictFrequencyReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictFrequencyReviewReviewerLengthRule implements StrictFrequencyReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictFrequencyReview): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictFrequencyReviewCreatedAtRangeRule implements StrictFrequencyReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictFrequencyReview): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictFrequencyReviewMinimumRangeRule implements StrictFrequencyReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictFrequencyReview): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a strict frequency review. */
export class StrictFrequencyReviewValidator {
  rules: StrictFrequencyReviewRule[];

  constructor(rules: StrictFrequencyReviewRule[]) {
    this.rules = rules;
  }

  validate(item: StrictFrequencyReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictFrequencyReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictFrequencyReview[]): Map<string, string[]> {
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

export function defaultStrictFrequencyReviewValidator(): StrictFrequencyReviewValidator {
  return new StrictFrequencyReviewValidator(
    [
      new StrictFrequencyReviewTitleLengthRule(32),
      new StrictFrequencyReviewAllowedReviewerRule([]),
      new StrictFrequencyReviewCodeLengthRule(120),
      new StrictFrequencyReviewReviewerLengthRule(1000),
      new StrictFrequencyReviewCreatedAtRangeRule(3600, 86400),
      new StrictFrequencyReviewMinimumRangeRule(8.4, 4310.9),
    ],
  );
}
