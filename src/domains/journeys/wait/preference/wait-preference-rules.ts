import { WaitPreference } from "./wait-preference.js";

/** A rule a wait preference must pass. Check returns its problems, or none. */
export interface WaitPreferenceRule {
  check(item: WaitPreference): string[];
}

export class WaitPreferenceMarginRangeRule implements WaitPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitPreference): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WaitPreferenceRequiredCodeRule implements WaitPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitPreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WaitPreferenceConversionRateRangeRule implements WaitPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitPreference): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WaitPreferenceRequiredNameRule implements WaitPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitPreference): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WaitPreferenceCodeLengthRule implements WaitPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a wait preference. */
export class WaitPreferenceValidator {
  rules: WaitPreferenceRule[];

  constructor(rules: WaitPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: WaitPreference): string[] {
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

  requireValid(item: WaitPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitPreference[]): Map<string, string[]> {
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

export function defaultWaitPreferenceValidator(): WaitPreferenceValidator {
  return new WaitPreferenceValidator(
    [
      new WaitPreferenceMarginRangeRule(9.3, 2327.3),
      new WaitPreferenceRequiredCodeRule("wait preference needs an entry"),
      new WaitPreferenceConversionRateRangeRule(5.6, 3719.9),
      new WaitPreferenceRequiredNameRule("wait preference needs an entry"),
      new WaitPreferenceCodeLengthRule(80),
    ],
  );
}
