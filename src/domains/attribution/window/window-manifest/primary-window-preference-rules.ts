import * as text from "../../../../kit/text.js";
import { PrimaryWindowPreference } from "./primary-window-preference.js";

/** A rule a primary window preference must pass. Check returns its problems, or none. */
export interface PrimaryWindowPreferenceRule {
  check(item: PrimaryWindowPreference): string[];
}

export class PrimaryWindowPreferenceChecksumLengthRule implements PrimaryWindowPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryWindowPreference): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryWindowPreferenceAllowedCurrencyRule implements PrimaryWindowPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryWindowPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is out of range`];
    return [];
  }
}

export class PrimaryWindowPreferenceRequiredTitleRule implements PrimaryWindowPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryWindowPreference): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryWindowPreferenceCurrencyLengthRule implements PrimaryWindowPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryWindowPreference): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary window preference. */
export class PrimaryWindowPreferenceValidator {
  rules: PrimaryWindowPreferenceRule[];

  constructor(rules: PrimaryWindowPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryWindowPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryWindowPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryWindowPreference[]): Map<string, string[]> {
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

export function defaultPrimaryWindowPreferenceValidator(): PrimaryWindowPreferenceValidator {
  return new PrimaryWindowPreferenceValidator(
    [
      new PrimaryWindowPreferenceChecksumLengthRule(64),
      new PrimaryWindowPreferenceAllowedCurrencyRule(["weighted", "primary"]),
      new PrimaryWindowPreferenceRequiredTitleRule("primary window preference needs this field"),
      new PrimaryWindowPreferenceCurrencyLengthRule(32),
    ],
  );
}
