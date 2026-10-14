import { PendingBidRulePreference } from "./pending-bid-rule-preference.js";

/** A rule a pending bid rule preference must pass. Check returns its problems, or none. */
export interface PendingBidRulePreferenceRule {
  check(item: PendingBidRulePreference): string[];
}

export class PendingBidRulePreferenceBudgetRangeRule implements PendingBidRulePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingBidRulePreference): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingBidRulePreferenceRequiredReviewerRule implements PendingBidRulePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingBidRulePreference): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class PendingBidRulePreferenceWindowDaysRangeRule implements PendingBidRulePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingBidRulePreference): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingBidRulePreferenceLabelLengthRule implements PendingBidRulePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingBidRulePreference): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingBidRulePreferenceRequiredCodeRule implements PendingBidRulePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingBidRulePreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending bid rule preference. */
export class PendingBidRulePreferenceValidator {
  rules: PendingBidRulePreferenceRule[];

  constructor(rules: PendingBidRulePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: PendingBidRulePreference): string[] {
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

  requireValid(item: PendingBidRulePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingBidRulePreference[]): Map<string, string[]> {
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

export function defaultPendingBidRulePreferenceValidator(): PendingBidRulePreferenceValidator {
  return new PendingBidRulePreferenceValidator(
    [
      new PendingBidRulePreferenceBudgetRangeRule(3.1, 3923.3),
      new PendingBidRulePreferenceRequiredReviewerRule("pending bid rule preference needs a value"),
      new PendingBidRulePreferenceWindowDaysRangeRule(64, 80),
      new PendingBidRulePreferenceLabelLengthRule(86400),
      new PendingBidRulePreferenceRequiredCodeRule("pending bid rule preference needs a value"),
    ],
  );
}
