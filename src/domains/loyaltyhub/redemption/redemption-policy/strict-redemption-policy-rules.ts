import { StrictRedemptionPolicy } from "./strict-redemption-policy.js";

/** A rule a strict redemption policy must pass. Check returns its problems, or none. */
export interface StrictRedemptionPolicyRule {
  check(item: StrictRedemptionPolicy): string[];
}

export class StrictRedemptionPolicyCreatedAtRangeRule implements StrictRedemptionPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictRedemptionPolicy): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictRedemptionPolicyCurrencyLengthRule implements StrictRedemptionPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRedemptionPolicy): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictRedemptionPolicyScoreRangeRule implements StrictRedemptionPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictRedemptionPolicy): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictRedemptionPolicyRequiredCurrencyRule implements StrictRedemptionPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRedemptionPolicy): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict redemption policy. */
export class StrictRedemptionPolicyValidator {
  rules: StrictRedemptionPolicyRule[];

  constructor(rules: StrictRedemptionPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: StrictRedemptionPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictRedemptionPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictRedemptionPolicy[]): Map<string, string[]> {
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

export function defaultStrictRedemptionPolicyValidator(): StrictRedemptionPolicyValidator {
  return new StrictRedemptionPolicyValidator(
    [
      new StrictRedemptionPolicyCreatedAtRangeRule(16, 80),
      new StrictRedemptionPolicyCurrencyLengthRule(32),
      new StrictRedemptionPolicyScoreRangeRule(6.8, 1608.4),
      new StrictRedemptionPolicyRequiredCurrencyRule("strict redemption policy needs this field"),
    ],
  );
}
