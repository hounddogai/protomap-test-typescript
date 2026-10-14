import { ManualPayoutEstimate } from "./manual-payout-estimate.js";

/** A rule a manual payout estimate must pass. Check returns its problems, or none. */
export interface ManualPayoutEstimateRule {
  check(item: ManualPayoutEstimate): string[];
}

export class ManualPayoutEstimateConversionRateRangeRule implements ManualPayoutEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPayoutEstimate): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualPayoutEstimateRequiredCodeRule implements ManualPayoutEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPayoutEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPayoutEstimateCountryLengthRule implements ManualPayoutEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPayoutEstimate): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPayoutEstimateRequiredCountryRule implements ManualPayoutEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPayoutEstimate): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPayoutEstimateFrequencyCapRangeRule implements ManualPayoutEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPayoutEstimate): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual payout estimate. */
export class ManualPayoutEstimateValidator {
  rules: ManualPayoutEstimateRule[];

  constructor(rules: ManualPayoutEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPayoutEstimate): string[] {
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

  requireValid(item: ManualPayoutEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPayoutEstimate[]): Map<string, string[]> {
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

export function defaultManualPayoutEstimateValidator(): ManualPayoutEstimateValidator {
  return new ManualPayoutEstimateValidator(
    [
      new ManualPayoutEstimateConversionRateRangeRule(4, 3239.8),
      new ManualPayoutEstimateRequiredCodeRule("manual payout estimate needs this field"),
      new ManualPayoutEstimateCountryLengthRule(86400),
      new ManualPayoutEstimateRequiredCountryRule("manual payout estimate needs a value"),
      new ManualPayoutEstimateFrequencyCapRangeRule(3600, 3600),
    ],
  );
}
