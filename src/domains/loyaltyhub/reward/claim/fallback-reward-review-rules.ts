import * as text from "../../../../kit/text.js";
import { FallbackRewardReview } from "./fallback-reward-review.js";

/** A rule a fallback reward review must pass. Check returns its problems, or none. */
export interface FallbackRewardReviewRule {
  check(item: FallbackRewardReview): string[];
}

export class FallbackRewardReviewNameLengthRule implements FallbackRewardReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackRewardReview): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackRewardReviewAllowedCountryRule implements FallbackRewardReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackRewardReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is too long`];
    return [];
  }
}

export class FallbackRewardReviewRegionLengthRule implements FallbackRewardReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackRewardReview): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackRewardReviewBatchSizeRangeRule implements FallbackRewardReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackRewardReview): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fallback reward review. */
export class FallbackRewardReviewValidator {
  rules: FallbackRewardReviewRule[];

  constructor(rules: FallbackRewardReviewRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackRewardReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackRewardReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackRewardReview[]): Map<string, string[]> {
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

export function defaultFallbackRewardReviewValidator(): FallbackRewardReviewValidator {
  return new FallbackRewardReviewValidator(
    [
      new FallbackRewardReviewNameLengthRule(16),
      new FallbackRewardReviewAllowedCountryRule(["batched", "manual"]),
      new FallbackRewardReviewRegionLengthRule(32),
      new FallbackRewardReviewBatchSizeRangeRule(120, 1000),
    ],
  );
}
