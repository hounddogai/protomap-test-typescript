import { StreakPreference } from "./streak-preference.js";

/** A rule a streak preference must pass. Check returns its problems, or none. */
export interface StreakPreferenceRule {
  check(item: StreakPreference): string[];
}

export class StreakPreferenceCodeLengthRule implements StreakPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakPreferenceSequenceRangeRule implements StreakPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakPreference): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StreakPreferenceRequiredCodeRule implements StreakPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakPreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StreakPreferenceRequiredTitleRule implements StreakPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakPreference): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StreakPreferenceLocaleLengthRule implements StreakPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakPreference): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakPreferenceRequiredLocaleRule implements StreakPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakPreference): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a streak preference. */
export class StreakPreferenceValidator {
  rules: StreakPreferenceRule[];

  constructor(rules: StreakPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: StreakPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StreakPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakPreference[]): Map<string, string[]> {
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

export function defaultStreakPreferenceValidator(): StreakPreferenceValidator {
  return new StreakPreferenceValidator(
    [
      new StreakPreferenceCodeLengthRule(255),
      new StreakPreferenceSequenceRangeRule(120, 86400),
      new StreakPreferenceRequiredCodeRule("streak preference needs an entry"),
      new StreakPreferenceRequiredTitleRule("streak preference needs this field"),
      new StreakPreferenceLocaleLengthRule(80),
      new StreakPreferenceRequiredLocaleRule("streak preference needs this field"),
    ],
  );
}
