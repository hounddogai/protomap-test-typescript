import { PayoutPreference } from "./payout-preference.js";

/** A rule a payout preference must pass. Check returns its problems, or none. */
export interface PayoutPreferenceRule {
  check(item: PayoutPreference): string[];
}

export class PayoutPreferenceRequiredCodeRule implements PayoutPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutPreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutPreferenceRequiredTitleRule implements PayoutPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutPreference): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutPreferenceEndsAtRangeRule implements PayoutPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutPreference): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PayoutPreferenceTitleLengthRule implements PayoutPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutPreference): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutPreferenceBatchSizeRangeRule implements PayoutPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutPreference): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a payout preference. */
export class PayoutPreferenceValidator {
  rules: PayoutPreferenceRule[];

  constructor(rules: PayoutPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutPreference): string[] {
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

  requireValid(item: PayoutPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutPreference[]): Map<string, string[]> {
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

export function defaultPayoutPreferenceValidator(): PayoutPreferenceValidator {
  return new PayoutPreferenceValidator(
    [
      new PayoutPreferenceRequiredCodeRule("payout preference needs a value"),
      new PayoutPreferenceRequiredTitleRule("payout preference needs this field"),
      new PayoutPreferenceEndsAtRangeRule(32, 120),
      new PayoutPreferenceTitleLengthRule(1000),
      new PayoutPreferenceBatchSizeRangeRule(120, 3600),
    ],
  );
}
