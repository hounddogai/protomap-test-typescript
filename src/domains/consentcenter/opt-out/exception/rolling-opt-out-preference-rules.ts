import { RollingOptOutPreference } from "./rolling-opt-out-preference.js";

/** A rule a rolling opt out preference must pass. Check returns its problems, or none. */
export interface RollingOptOutPreferenceRule {
  check(item: RollingOptOutPreference): string[];
}

export class RollingOptOutPreferenceAmountRangeRule implements RollingOptOutPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingOptOutPreference): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingOptOutPreferenceTitleLengthRule implements RollingOptOutPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingOptOutPreference): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingOptOutPreferenceCodeLengthRule implements RollingOptOutPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingOptOutPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingOptOutPreferenceConversionRateRangeRule implements RollingOptOutPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingOptOutPreference): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingOptOutPreferenceRequiredCodeRule implements RollingOptOutPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingOptOutPreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling opt out preference. */
export class RollingOptOutPreferenceValidator {
  rules: RollingOptOutPreferenceRule[];

  constructor(rules: RollingOptOutPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: RollingOptOutPreference): string[] {
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

  requireValid(item: RollingOptOutPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingOptOutPreference[]): Map<string, string[]> {
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

export function defaultRollingOptOutPreferenceValidator(): RollingOptOutPreferenceValidator {
  return new RollingOptOutPreferenceValidator(
    [
      new RollingOptOutPreferenceAmountRangeRule(5.1, 1280.5),
      new RollingOptOutPreferenceTitleLengthRule(3600),
      new RollingOptOutPreferenceCodeLengthRule(86400),
      new RollingOptOutPreferenceConversionRateRangeRule(3.7, 4566.8),
      new RollingOptOutPreferenceRequiredCodeRule("rolling opt out preference needs an entry"),
    ],
  );
}
