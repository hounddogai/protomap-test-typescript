import { BouncePreference } from "./bounce-preference.js";

/** A rule a bounce preference must pass. Check returns its problems, or none. */
export interface BouncePreferenceRule {
  check(item: BouncePreference): string[];
}

export class BouncePreferenceRequiredCodeRule implements BouncePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BouncePreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BouncePreferenceBudgetRangeRule implements BouncePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BouncePreference): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BouncePreferenceLocaleLengthRule implements BouncePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BouncePreference): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BouncePreferenceRequiredCampaignRefRule implements BouncePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BouncePreference): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class BouncePreferenceCodePrefixRule implements BouncePreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BouncePreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BouncePreferenceCodeLengthRule implements BouncePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BouncePreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a bounce preference. */
export class BouncePreferenceValidator {
  rules: BouncePreferenceRule[];

  constructor(rules: BouncePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: BouncePreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BouncePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BouncePreference[]): Map<string, string[]> {
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

export function defaultBouncePreferenceValidator(): BouncePreferenceValidator {
  return new BouncePreferenceValidator(
    [
      new BouncePreferenceRequiredCodeRule("bounce preference needs this field"),
      new BouncePreferenceBudgetRangeRule(7.5, 1047.1),
      new BouncePreferenceLocaleLengthRule(120),
      new BouncePreferenceRequiredCampaignRefRule("bounce preference needs this field"),
      new BouncePreferenceCodePrefixRule("ACM"),
      new BouncePreferenceCodeLengthRule(64),
    ],
  );
}
