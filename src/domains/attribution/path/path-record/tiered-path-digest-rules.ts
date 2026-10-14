import { TieredPathDigest } from "./tiered-path-digest.js";

/** A rule a tiered path digest must pass. Check returns its problems, or none. */
export interface TieredPathDigestRule {
  check(item: TieredPathDigest): string[];
}

export class TieredPathDigestDiscountRangeRule implements TieredPathDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPathDigest): string[] {
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

export class TieredPathDigestReviewerLengthRule implements TieredPathDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPathDigest): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredPathDigestCreatedAtRangeRule implements TieredPathDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPathDigest): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered path digest. */
export class TieredPathDigestValidator {
  rules: TieredPathDigestRule[];

  constructor(rules: TieredPathDigestRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPathDigest): string[] {
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

  requireValid(item: TieredPathDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPathDigest[]): Map<string, string[]> {
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

export function defaultTieredPathDigestValidator(): TieredPathDigestValidator {
  return new TieredPathDigestValidator(
    [
      new TieredPathDigestDiscountRangeRule(3.3, 1693.8),
      new TieredPathDigestReviewerLengthRule(64),
      new TieredPathDigestCreatedAtRangeRule(64, 64),
    ],
  );
}
