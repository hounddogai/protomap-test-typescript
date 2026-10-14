import { LenientBidRulePreference } from "./lenient-bid-rule-preference.js";

/** A rule a lenient bid rule preference must pass. Check returns its problems, or none. */
export interface LenientBidRulePreferenceRule {
  check(item: LenientBidRulePreference): string[];
}

export class LenientBidRulePreferenceQuantityRangeRule implements LenientBidRulePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientBidRulePreference): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientBidRulePreferenceCodeLengthRule implements LenientBidRulePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientBidRulePreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientBidRulePreferenceRequiredNameRule implements LenientBidRulePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientBidRulePreference): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LenientBidRulePreferenceRequiredLocaleRule implements LenientBidRulePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientBidRulePreference): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient bid rule preference. */
export class LenientBidRulePreferenceValidator {
  rules: LenientBidRulePreferenceRule[];

  constructor(rules: LenientBidRulePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: LenientBidRulePreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientBidRulePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientBidRulePreference[]): Map<string, string[]> {
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

export function defaultLenientBidRulePreferenceValidator(): LenientBidRulePreferenceValidator {
  return new LenientBidRulePreferenceValidator(
    [
      new LenientBidRulePreferenceQuantityRangeRule(16, 80),
      new LenientBidRulePreferenceCodeLengthRule(80),
      new LenientBidRulePreferenceRequiredNameRule("lenient bid rule preference needs this field"),
      new LenientBidRulePreferenceRequiredLocaleRule("lenient bid rule preference needs a value"),
    ],
  );
}
