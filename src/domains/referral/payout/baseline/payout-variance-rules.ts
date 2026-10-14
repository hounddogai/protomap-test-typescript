import { PayoutVariance } from "./payout-variance.js";

/** A rule a payout variance must pass. Check returns its problems, or none. */
export interface PayoutVarianceRule {
  check(item: PayoutVariance): string[];
}

export class PayoutVarianceCodeLengthRule implements PayoutVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutVarianceChecksumLengthRule implements PayoutVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutVariance): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutVarianceThresholdRangeRule implements PayoutVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutVariance): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a payout variance. */
export class PayoutVarianceValidator {
  rules: PayoutVarianceRule[];

  constructor(rules: PayoutVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutVariance): string[] {
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

  requireValid(item: PayoutVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutVariance[]): Map<string, string[]> {
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

export function defaultPayoutVarianceValidator(): PayoutVarianceValidator {
  return new PayoutVarianceValidator(
    [
      new PayoutVarianceCodeLengthRule(86400),
      new PayoutVarianceChecksumLengthRule(120),
      new PayoutVarianceThresholdRangeRule(9.5, 316.6),
    ],
  );
}
