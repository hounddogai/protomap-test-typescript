import * as text from "../../../../kit/text.js";
import { LegacyProofReview } from "./legacy-proof-review.js";

/** A rule a legacy proof review must pass. Check returns its problems, or none. */
export interface LegacyProofReviewRule {
  check(item: LegacyProofReview): string[];
}

export class LegacyProofReviewAllowedChannelRule implements LegacyProofReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyProofReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is expired`];
    return [];
  }
}

export class LegacyProofReviewDiscountRangeRule implements LegacyProofReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyProofReview): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyProofReviewAmountRangeRule implements LegacyProofReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyProofReview): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyProofReviewPriorityRangeRule implements LegacyProofReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyProofReview): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a legacy proof review. */
export class LegacyProofReviewValidator {
  rules: LegacyProofReviewRule[];

  constructor(rules: LegacyProofReviewRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyProofReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyProofReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyProofReview[]): Map<string, string[]> {
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

export function defaultLegacyProofReviewValidator(): LegacyProofReviewValidator {
  return new LegacyProofReviewValidator(
    [
      new LegacyProofReviewAllowedChannelRule([]),
      new LegacyProofReviewDiscountRangeRule(2, 646.5),
      new LegacyProofReviewAmountRangeRule(9.6, 2304.1),
      new LegacyProofReviewPriorityRangeRule(32, 64),
    ],
  );
}
