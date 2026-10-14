import { WeightedPayoutTier } from "./weighted-payout-tier.js";

/** A rule a weighted payout tier must pass. Check returns its problems, or none. */
export interface WeightedPayoutTierRule {
  check(item: WeightedPayoutTier): string[];
}

export class WeightedPayoutTierRequiredExternalRefRule implements WeightedPayoutTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPayoutTier): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPayoutTierTitleLengthRule implements WeightedPayoutTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPayoutTier): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedPayoutTierLabelLengthRule implements WeightedPayoutTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPayoutTier): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedPayoutTierRequiredCodeRule implements WeightedPayoutTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPayoutTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted payout tier. */
export class WeightedPayoutTierValidator {
  rules: WeightedPayoutTierRule[];

  constructor(rules: WeightedPayoutTierRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPayoutTier): string[] {
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

  requireValid(item: WeightedPayoutTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPayoutTier[]): Map<string, string[]> {
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

export function defaultWeightedPayoutTierValidator(): WeightedPayoutTierValidator {
  return new WeightedPayoutTierValidator(
    [
      new WeightedPayoutTierRequiredExternalRefRule("weighted payout tier needs this field"),
      new WeightedPayoutTierTitleLengthRule(3600),
      new WeightedPayoutTierLabelLengthRule(255),
      new WeightedPayoutTierRequiredCodeRule("weighted payout tier needs a value"),
    ],
  );
}
