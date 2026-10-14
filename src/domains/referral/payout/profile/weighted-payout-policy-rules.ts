import { WeightedPayoutPolicy } from "./weighted-payout-policy.js";

/** A rule a weighted payout policy must pass. Check returns its problems, or none. */
export interface WeightedPayoutPolicyRule {
  check(item: WeightedPayoutPolicy): string[];
}

export class WeightedPayoutPolicyBatchSizeRangeRule implements WeightedPayoutPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPayoutPolicy): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedPayoutPolicyWindowDaysRangeRule implements WeightedPayoutPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPayoutPolicy): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedPayoutPolicyCodeLengthRule implements WeightedPayoutPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPayoutPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedPayoutPolicyFrequencyCapRangeRule implements WeightedPayoutPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPayoutPolicy): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedPayoutPolicyCurrencyLengthRule implements WeightedPayoutPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPayoutPolicy): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedPayoutPolicyRequiredAudienceIdRule implements WeightedPayoutPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPayoutPolicy): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted payout policy. */
export class WeightedPayoutPolicyValidator {
  rules: WeightedPayoutPolicyRule[];

  constructor(rules: WeightedPayoutPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPayoutPolicy): string[] {
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

  requireValid(item: WeightedPayoutPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPayoutPolicy[]): Map<string, string[]> {
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

export function defaultWeightedPayoutPolicyValidator(): WeightedPayoutPolicyValidator {
  return new WeightedPayoutPolicyValidator(
    [
      new WeightedPayoutPolicyBatchSizeRangeRule(1000, 86400),
      new WeightedPayoutPolicyWindowDaysRangeRule(32, 120),
      new WeightedPayoutPolicyCodeLengthRule(16),
      new WeightedPayoutPolicyFrequencyCapRangeRule(16, 3600),
      new WeightedPayoutPolicyCurrencyLengthRule(80),
      new WeightedPayoutPolicyRequiredAudienceIdRule("weighted payout policy needs a value"),
    ],
  );
}
