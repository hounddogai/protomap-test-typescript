import { OptOutPreference } from "./opt-out-preference.js";

/** A rule a opt out preference must pass. Check returns its problems, or none. */
export interface OptOutPreferenceRule {
  check(item: OptOutPreference): string[];
}

export class OptOutPreferenceRequiredContactEmailRule implements OptOutPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutPreference): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutPreferenceContactEmailLengthRule implements OptOutPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutPreference): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutPreferenceRateRangeRule implements OptOutPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutPreference): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a opt out preference. */
export class OptOutPreferenceValidator {
  rules: OptOutPreferenceRule[];

  constructor(rules: OptOutPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: OptOutPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutPreference[]): Map<string, string[]> {
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

export function defaultOptOutPreferenceValidator(): OptOutPreferenceValidator {
  return new OptOutPreferenceValidator(
    [
      new OptOutPreferenceRequiredContactEmailRule("opt out preference needs a value"),
      new OptOutPreferenceContactEmailLengthRule(1000),
      new OptOutPreferenceRateRangeRule(9.8, 593.9),
    ],
  );
}
