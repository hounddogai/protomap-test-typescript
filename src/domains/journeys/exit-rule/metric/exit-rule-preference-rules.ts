import { ExitRulePreference } from "./exit-rule-preference.js";

/** A rule a exit rule preference must pass. Check returns its problems, or none. */
export interface ExitRulePreferenceRule {
  check(item: ExitRulePreference): string[];
}

export class ExitRulePreferenceRequiredReviewerRule implements ExitRulePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRulePreference): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRulePreferenceLabelLengthRule implements ExitRulePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRulePreference): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRulePreferenceRateRangeRule implements ExitRulePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRulePreference): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a exit rule preference. */
export class ExitRulePreferenceValidator {
  rules: ExitRulePreferenceRule[];

  constructor(rules: ExitRulePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRulePreference): string[] {
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

  requireValid(item: ExitRulePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRulePreference[]): Map<string, string[]> {
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

export function defaultExitRulePreferenceValidator(): ExitRulePreferenceValidator {
  return new ExitRulePreferenceValidator(
    [
      new ExitRulePreferenceRequiredReviewerRule("exit rule preference needs a value"),
      new ExitRulePreferenceLabelLengthRule(255),
      new ExitRulePreferenceRateRangeRule(0.2, 3000.5),
    ],
  );
}
