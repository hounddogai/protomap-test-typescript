import * as text from "../../../../kit/text.js";
import { TieredPaywallPreference } from "./tiered-paywall-preference.js";

/** A rule a tiered paywall preference must pass. Check returns its problems, or none. */
export interface TieredPaywallPreferenceRule {
  check(item: TieredPaywallPreference): string[];
}

export class TieredPaywallPreferenceUtmSourceLengthRule implements TieredPaywallPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPaywallPreference): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredPaywallPreferenceWeightRangeRule implements TieredPaywallPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPaywallPreference): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredPaywallPreferenceAllowedTitleRule implements TieredPaywallPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredPaywallPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is duplicated`];
    return [];
  }
}

export class TieredPaywallPreferenceCodeLengthRule implements TieredPaywallPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPaywallPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered paywall preference. */
export class TieredPaywallPreferenceValidator {
  rules: TieredPaywallPreferenceRule[];

  constructor(rules: TieredPaywallPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPaywallPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredPaywallPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPaywallPreference[]): Map<string, string[]> {
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

export function defaultTieredPaywallPreferenceValidator(): TieredPaywallPreferenceValidator {
  return new TieredPaywallPreferenceValidator(
    [
      new TieredPaywallPreferenceUtmSourceLengthRule(120),
      new TieredPaywallPreferenceWeightRangeRule(5.9, 1146.7),
      new TieredPaywallPreferenceAllowedTitleRule([]),
      new TieredPaywallPreferenceCodeLengthRule(1000),
    ],
  );
}
