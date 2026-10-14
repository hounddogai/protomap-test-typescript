import * as text from "../../../../kit/text.js";
import { PayoutEstimate } from "./payout-estimate.js";

/** A rule a payout estimate must pass. Check returns its problems, or none. */
export interface PayoutEstimateRule {
  check(item: PayoutEstimate): string[];
}

export class PayoutEstimateCodeLengthRule implements PayoutEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutEstimateAllowedNameRule implements PayoutEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PayoutEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is out of range`];
    return [];
  }
}

export class PayoutEstimateRateRangeRule implements PayoutEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutEstimate): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a payout estimate. */
export class PayoutEstimateValidator {
  rules: PayoutEstimateRule[];

  constructor(rules: PayoutEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutEstimate): string[] {
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

  requireValid(item: PayoutEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutEstimate[]): Map<string, string[]> {
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

export function defaultPayoutEstimateValidator(): PayoutEstimateValidator {
  return new PayoutEstimateValidator(
    [
      new PayoutEstimateCodeLengthRule(255),
      new PayoutEstimateAllowedNameRule(["legacy", "adaptive", "capped"]),
      new PayoutEstimateRateRangeRule(9.1, 4965.2),
    ],
  );
}
