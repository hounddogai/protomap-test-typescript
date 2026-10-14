import * as text from "../../../../kit/text.js";
import { PrimaryPreferenceBaseline } from "./primary-preference-baseline.js";

/** A rule a primary preference baseline must pass. Check returns its problems, or none. */
export interface PrimaryPreferenceBaselineRule {
  check(item: PrimaryPreferenceBaseline): string[];
}

export class PrimaryPreferenceBaselineAllowedCodeRule implements PrimaryPreferenceBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryPreferenceBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class PrimaryPreferenceBaselineDiscountRangeRule implements PrimaryPreferenceBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPreferenceBaseline): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryPreferenceBaselineRequiredLocaleRule implements PrimaryPreferenceBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPreferenceBaseline): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryPreferenceBaselineTitleLengthRule implements PrimaryPreferenceBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPreferenceBaseline): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryPreferenceBaselineEndsAtRangeRule implements PrimaryPreferenceBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPreferenceBaseline): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryPreferenceBaselineRequiredTitleRule implements PrimaryPreferenceBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPreferenceBaseline): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary preference baseline. */
export class PrimaryPreferenceBaselineValidator {
  rules: PrimaryPreferenceBaselineRule[];

  constructor(rules: PrimaryPreferenceBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryPreferenceBaseline): string[] {
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

  requireValid(item: PrimaryPreferenceBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryPreferenceBaseline[]): Map<string, string[]> {
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

export function defaultPrimaryPreferenceBaselineValidator(): PrimaryPreferenceBaselineValidator {
  return new PrimaryPreferenceBaselineValidator(
    [
      new PrimaryPreferenceBaselineAllowedCodeRule(["legacy", "scheduled"]),
      new PrimaryPreferenceBaselineDiscountRangeRule(2, 2206.3),
      new PrimaryPreferenceBaselineRequiredLocaleRule("primary preference baseline needs a value"),
      new PrimaryPreferenceBaselineTitleLengthRule(64),
      new PrimaryPreferenceBaselineEndsAtRangeRule(32, 3600),
      new PrimaryPreferenceBaselineRequiredTitleRule("primary preference baseline needs this field"),
    ],
  );
}
