import * as text from "../../../../kit/text.js";
import { TieredReplyVariance } from "./tiered-reply-variance.js";

/** A rule a tiered reply variance must pass. Check returns its problems, or none. */
export interface TieredReplyVarianceRule {
  check(item: TieredReplyVariance): string[];
}

export class TieredReplyVarianceTitleLengthRule implements TieredReplyVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredReplyVariance): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredReplyVarianceAllowedTitleRule implements TieredReplyVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredReplyVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is not allowed`];
    return [];
  }
}

export class TieredReplyVarianceGraceDaysRangeRule implements TieredReplyVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredReplyVariance): string[] {
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

export class TieredReplyVarianceRequiredReviewerRule implements TieredReplyVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredReplyVariance): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class TieredReplyVarianceReviewerLengthRule implements TieredReplyVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredReplyVariance): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered reply variance. */
export class TieredReplyVarianceValidator {
  rules: TieredReplyVarianceRule[];

  constructor(rules: TieredReplyVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: TieredReplyVariance): string[] {
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

  requireValid(item: TieredReplyVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredReplyVariance[]): Map<string, string[]> {
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

export function defaultTieredReplyVarianceValidator(): TieredReplyVarianceValidator {
  return new TieredReplyVarianceValidator(
    [
      new TieredReplyVarianceTitleLengthRule(32),
      new TieredReplyVarianceAllowedTitleRule(["fallback"]),
      new TieredReplyVarianceGraceDaysRangeRule(16, 255),
      new TieredReplyVarianceRequiredReviewerRule("tiered reply variance needs this field"),
      new TieredReplyVarianceReviewerLengthRule(1000),
    ],
  );
}
