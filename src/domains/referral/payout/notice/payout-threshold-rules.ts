import { PayoutThreshold } from "./payout-threshold.js";

/** A rule a payout threshold must pass. Check returns its problems, or none. */
export interface PayoutThresholdRule {
  check(item: PayoutThreshold): string[];
}

export class PayoutThresholdDiscountRangeRule implements PayoutThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutThreshold): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PayoutThresholdRequiredTitleRule implements PayoutThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutThreshold): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutThresholdLocaleLengthRule implements PayoutThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutThreshold): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a payout threshold. */
export class PayoutThresholdValidator {
  rules: PayoutThresholdRule[];

  constructor(rules: PayoutThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PayoutThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutThreshold[]): Map<string, string[]> {
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

export function defaultPayoutThresholdValidator(): PayoutThresholdValidator {
  return new PayoutThresholdValidator(
    [
      new PayoutThresholdDiscountRangeRule(3.4, 3458.7),
      new PayoutThresholdRequiredTitleRule("payout threshold needs a value"),
      new PayoutThresholdLocaleLengthRule(86400),
    ],
  );
}
