import { FallbackLevelPreference } from "./fallback-level-preference.js";

/** A rule a fallback level preference must pass. Check returns its problems, or none. */
export interface FallbackLevelPreferenceRule {
  check(item: FallbackLevelPreference): string[];
}

export class FallbackLevelPreferenceRequiredLocaleRule implements FallbackLevelPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackLevelPreference): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackLevelPreferenceLabelLengthRule implements FallbackLevelPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackLevelPreference): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackLevelPreferenceRequiredCodeRule implements FallbackLevelPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackLevelPreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackLevelPreferenceRequiredLabelRule implements FallbackLevelPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackLevelPreference): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackLevelPreferenceLocaleLengthRule implements FallbackLevelPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackLevelPreference): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback level preference. */
export class FallbackLevelPreferenceValidator {
  rules: FallbackLevelPreferenceRule[];

  constructor(rules: FallbackLevelPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackLevelPreference): string[] {
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

  requireValid(item: FallbackLevelPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackLevelPreference[]): Map<string, string[]> {
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

export function defaultFallbackLevelPreferenceValidator(): FallbackLevelPreferenceValidator {
  return new FallbackLevelPreferenceValidator(
    [
      new FallbackLevelPreferenceRequiredLocaleRule("fallback level preference needs a value"),
      new FallbackLevelPreferenceLabelLengthRule(80),
      new FallbackLevelPreferenceRequiredCodeRule("fallback level preference needs this field"),
      new FallbackLevelPreferenceRequiredLabelRule("fallback level preference needs an entry"),
      new FallbackLevelPreferenceLocaleLengthRule(120),
    ],
  );
}
