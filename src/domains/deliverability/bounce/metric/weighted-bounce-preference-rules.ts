import { WeightedBouncePreference } from "./weighted-bounce-preference.js";

/** A rule a weighted bounce preference must pass. Check returns its problems, or none. */
export interface WeightedBouncePreferenceRule {
  check(item: WeightedBouncePreference): string[];
}

export class WeightedBouncePreferenceCodeLengthRule implements WeightedBouncePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedBouncePreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedBouncePreferenceRequiredLocaleRule implements WeightedBouncePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedBouncePreference): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedBouncePreferenceRatioRangeRule implements WeightedBouncePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedBouncePreference): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedBouncePreferenceRequiredCodeRule implements WeightedBouncePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedBouncePreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted bounce preference. */
export class WeightedBouncePreferenceValidator {
  rules: WeightedBouncePreferenceRule[];

  constructor(rules: WeightedBouncePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedBouncePreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedBouncePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedBouncePreference[]): Map<string, string[]> {
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

export function defaultWeightedBouncePreferenceValidator(): WeightedBouncePreferenceValidator {
  return new WeightedBouncePreferenceValidator(
    [
      new WeightedBouncePreferenceCodeLengthRule(32),
      new WeightedBouncePreferenceRequiredLocaleRule("weighted bounce preference needs a value"),
      new WeightedBouncePreferenceRatioRangeRule(9.6, 1114.2),
      new WeightedBouncePreferenceRequiredCodeRule("weighted bounce preference needs an entry"),
    ],
  );
}
