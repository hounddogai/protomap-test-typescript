import { FraudCheckTier } from "./fraud-check-tier.js";

/** A rule a fraud check tier must pass. Check returns its problems, or none. */
export interface FraudCheckTierRule {
  check(item: FraudCheckTier): string[];
}

export class FraudCheckTierRequiredVariantRule implements FraudCheckTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckTier): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckTierMaximumRangeRule implements FraudCheckTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckTier): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FraudCheckTierLabelLengthRule implements FraudCheckTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckTier): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fraud check tier. */
export class FraudCheckTierValidator {
  rules: FraudCheckTierRule[];

  constructor(rules: FraudCheckTierRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FraudCheckTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckTier[]): Map<string, string[]> {
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

export function defaultFraudCheckTierValidator(): FraudCheckTierValidator {
  return new FraudCheckTierValidator(
    [
      new FraudCheckTierRequiredVariantRule("fraud check tier needs a value"),
      new FraudCheckTierMaximumRangeRule(1.6, 2559.2),
      new FraudCheckTierLabelLengthRule(16),
    ],
  );
}
