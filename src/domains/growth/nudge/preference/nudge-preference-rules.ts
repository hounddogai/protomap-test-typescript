import { NudgePreference } from "./nudge-preference.js";

/** A rule a nudge preference must pass. Check returns its problems, or none. */
export interface NudgePreferenceRule {
  check(item: NudgePreference): string[];
}

export class NudgePreferenceNameLengthRule implements NudgePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgePreference): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgePreferenceUtmSourceLengthRule implements NudgePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgePreference): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgePreferenceCodeLengthRule implements NudgePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgePreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgePreferenceOpenRateRangeRule implements NudgePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgePreference): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class NudgePreferenceLocaleLengthRule implements NudgePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgePreference): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgePreferenceAmountRangeRule implements NudgePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgePreference): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a nudge preference. */
export class NudgePreferenceValidator {
  rules: NudgePreferenceRule[];

  constructor(rules: NudgePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: NudgePreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: NudgePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgePreference[]): Map<string, string[]> {
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

export function defaultNudgePreferenceValidator(): NudgePreferenceValidator {
  return new NudgePreferenceValidator(
    [
      new NudgePreferenceNameLengthRule(64),
      new NudgePreferenceUtmSourceLengthRule(120),
      new NudgePreferenceCodeLengthRule(64),
      new NudgePreferenceOpenRateRangeRule(6.2, 1972.8),
      new NudgePreferenceLocaleLengthRule(120),
      new NudgePreferenceAmountRangeRule(3.6, 4050.2),
    ],
  );
}
