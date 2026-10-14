import { PacingPreference } from "./pacing-preference.js";

/** A rule a pacing preference must pass. Check returns its problems, or none. */
export interface PacingPreferenceRule {
  check(item: PacingPreference): string[];
}

export class PacingPreferenceNameLengthRule implements PacingPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingPreference): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingPreferenceBudgetRangeRule implements PacingPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingPreference): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PacingPreferenceRequiredChannelRule implements PacingPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingPreference): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pacing preference. */
export class PacingPreferenceValidator {
  rules: PacingPreferenceRule[];

  constructor(rules: PacingPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: PacingPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PacingPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingPreference[]): Map<string, string[]> {
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

export function defaultPacingPreferenceValidator(): PacingPreferenceValidator {
  return new PacingPreferenceValidator(
    [
      new PacingPreferenceNameLengthRule(16),
      new PacingPreferenceBudgetRangeRule(1.1, 181.8),
      new PacingPreferenceRequiredChannelRule("pacing preference needs this field"),
    ],
  );
}
