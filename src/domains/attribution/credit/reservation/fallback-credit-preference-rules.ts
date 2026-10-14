import { FallbackCreditPreference } from "./fallback-credit-preference.js";

/** A rule a fallback credit preference must pass. Check returns its problems, or none. */
export interface FallbackCreditPreferenceRule {
  check(item: FallbackCreditPreference): string[];
}

export class FallbackCreditPreferenceRevisionRangeRule implements FallbackCreditPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackCreditPreference): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackCreditPreferenceRequiredCodeRule implements FallbackCreditPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCreditPreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackCreditPreferenceRequiredUnitRule implements FallbackCreditPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCreditPreference): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackCreditPreferenceRequiredNameRule implements FallbackCreditPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCreditPreference): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback credit preference. */
export class FallbackCreditPreferenceValidator {
  rules: FallbackCreditPreferenceRule[];

  constructor(rules: FallbackCreditPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackCreditPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackCreditPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackCreditPreference[]): Map<string, string[]> {
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

export function defaultFallbackCreditPreferenceValidator(): FallbackCreditPreferenceValidator {
  return new FallbackCreditPreferenceValidator(
    [
      new FallbackCreditPreferenceRevisionRangeRule(64, 1000),
      new FallbackCreditPreferenceRequiredCodeRule("fallback credit preference needs an entry"),
      new FallbackCreditPreferenceRequiredUnitRule("fallback credit preference needs an entry"),
      new FallbackCreditPreferenceRequiredNameRule("fallback credit preference needs a value"),
    ],
  );
}
