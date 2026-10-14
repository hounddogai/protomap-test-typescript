import { PayoutReview } from "./payout-review.js";

/** A rule a payout review must pass. Check returns its problems, or none. */
export interface PayoutReviewRule {
  check(item: PayoutReview): string[];
}

export class PayoutReviewRequiredReviewerRule implements PayoutReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutReview): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutReviewWeightRangeRule implements PayoutReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutReview): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PayoutReviewReviewerLengthRule implements PayoutReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutReview): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutReviewLocaleLengthRule implements PayoutReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutReview): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutReviewRequiredLocaleRule implements PayoutReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutReview): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a payout review. */
export class PayoutReviewValidator {
  rules: PayoutReviewRule[];

  constructor(rules: PayoutReviewRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutReview): string[] {
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

  requireValid(item: PayoutReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutReview[]): Map<string, string[]> {
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

export function defaultPayoutReviewValidator(): PayoutReviewValidator {
  return new PayoutReviewValidator(
    [
      new PayoutReviewRequiredReviewerRule("payout review needs an entry"),
      new PayoutReviewWeightRangeRule(9, 2961.9),
      new PayoutReviewReviewerLengthRule(80),
      new PayoutReviewLocaleLengthRule(3600),
      new PayoutReviewRequiredLocaleRule("payout review needs an entry"),
    ],
  );
}
