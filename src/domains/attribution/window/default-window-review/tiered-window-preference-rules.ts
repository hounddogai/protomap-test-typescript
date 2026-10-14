import { TieredWindowPreference } from "./tiered-window-preference.js";

/** A rule a tiered window preference must pass. Check returns its problems, or none. */
export interface TieredWindowPreferenceRule {
  check(item: TieredWindowPreference): string[];
}

export class TieredWindowPreferenceRequiredLabelRule implements TieredWindowPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredWindowPreference): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredWindowPreferenceLabelLengthRule implements TieredWindowPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredWindowPreference): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredWindowPreferenceRequiredReviewerRule implements TieredWindowPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredWindowPreference): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class TieredWindowPreferenceCodeLengthRule implements TieredWindowPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredWindowPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredWindowPreferenceReviewerLengthRule implements TieredWindowPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredWindowPreference): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered window preference. */
export class TieredWindowPreferenceValidator {
  rules: TieredWindowPreferenceRule[];

  constructor(rules: TieredWindowPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: TieredWindowPreference): string[] {
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

  requireValid(item: TieredWindowPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredWindowPreference[]): Map<string, string[]> {
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

export function defaultTieredWindowPreferenceValidator(): TieredWindowPreferenceValidator {
  return new TieredWindowPreferenceValidator(
    [
      new TieredWindowPreferenceRequiredLabelRule("tiered window preference needs an entry"),
      new TieredWindowPreferenceLabelLengthRule(86400),
      new TieredWindowPreferenceRequiredReviewerRule("tiered window preference needs this field"),
      new TieredWindowPreferenceCodeLengthRule(120),
      new TieredWindowPreferenceReviewerLengthRule(80),
    ],
  );
}
