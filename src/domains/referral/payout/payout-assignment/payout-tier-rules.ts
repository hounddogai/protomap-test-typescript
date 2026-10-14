import * as text from "../../../../kit/text.js";
import { PayoutTier } from "./payout-tier.js";

/** A rule a payout tier must pass. Check returns its problems, or none. */
export interface PayoutTierRule {
  check(item: PayoutTier): string[];
}

export class PayoutTierRequiredLabelRule implements PayoutTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutTier): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutTierBatchSizeRangeRule implements PayoutTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutTier): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PayoutTierAllowedNameRule implements PayoutTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PayoutTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is unknown`];
    return [];
  }
}

export class PayoutTierCodeLengthRule implements PayoutTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutTierLocaleLengthRule implements PayoutTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutTier): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a payout tier. */
export class PayoutTierValidator {
  rules: PayoutTierRule[];

  constructor(rules: PayoutTierRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PayoutTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutTier[]): Map<string, string[]> {
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

export function defaultPayoutTierValidator(): PayoutTierValidator {
  return new PayoutTierValidator(
    [
      new PayoutTierRequiredLabelRule("payout tier needs this field"),
      new PayoutTierBatchSizeRangeRule(1000, 86400),
      new PayoutTierAllowedNameRule(["adaptive", "seasonal"]),
      new PayoutTierCodeLengthRule(16),
      new PayoutTierLocaleLengthRule(3600),
    ],
  );
}
