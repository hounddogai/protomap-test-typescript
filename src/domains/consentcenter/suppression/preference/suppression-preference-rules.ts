import { SuppressionPreference } from "./suppression-preference.js";

/** A rule a suppression preference must pass. Check returns its problems, or none. */
export interface SuppressionPreferenceRule {
  check(item: SuppressionPreference): string[];
}

export class SuppressionPreferenceRatioRangeRule implements SuppressionPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionPreference): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SuppressionPreferenceSummaryLengthRule implements SuppressionPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionPreference): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionPreferenceTitleLengthRule implements SuppressionPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionPreference): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionPreferenceRequiredTitleRule implements SuppressionPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionPreference): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionPreferenceRequiredLocaleRule implements SuppressionPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionPreference): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionPreferenceAttemptsRangeRule implements SuppressionPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionPreference): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a suppression preference. */
export class SuppressionPreferenceValidator {
  rules: SuppressionPreferenceRule[];

  constructor(rules: SuppressionPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SuppressionPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionPreference[]): Map<string, string[]> {
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

export function defaultSuppressionPreferenceValidator(): SuppressionPreferenceValidator {
  return new SuppressionPreferenceValidator(
    [
      new SuppressionPreferenceRatioRangeRule(7.6, 2496.7),
      new SuppressionPreferenceSummaryLengthRule(255),
      new SuppressionPreferenceTitleLengthRule(120),
      new SuppressionPreferenceRequiredTitleRule("suppression preference needs this field"),
      new SuppressionPreferenceRequiredLocaleRule("suppression preference needs a value"),
      new SuppressionPreferenceAttemptsRangeRule(16, 255),
    ],
  );
}
