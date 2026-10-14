import { ManualRewardRulePreference } from "./manual-reward-rule-preference.js";

/** A rule a manual reward rule preference must pass. Check returns its problems, or none. */
export interface ManualRewardRulePreferenceRule {
  check(item: ManualRewardRulePreference): string[];
}

export class ManualRewardRulePreferenceLimitRangeRule implements ManualRewardRulePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualRewardRulePreference): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualRewardRulePreferencePhoneLengthRule implements ManualRewardRulePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRewardRulePreference): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualRewardRulePreferenceRequiredLabelRule implements ManualRewardRulePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualRewardRulePreference): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ManualRewardRulePreferenceCodePrefixRule implements ManualRewardRulePreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualRewardRulePreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a manual reward rule preference. */
export class ManualRewardRulePreferenceValidator {
  rules: ManualRewardRulePreferenceRule[];

  constructor(rules: ManualRewardRulePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: ManualRewardRulePreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualRewardRulePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualRewardRulePreference[]): Map<string, string[]> {
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

export function defaultManualRewardRulePreferenceValidator(): ManualRewardRulePreferenceValidator {
  return new ManualRewardRulePreferenceValidator(
    [
      new ManualRewardRulePreferenceLimitRangeRule(16, 16),
      new ManualRewardRulePreferencePhoneLengthRule(1000),
      new ManualRewardRulePreferenceRequiredLabelRule("manual reward rule preference needs a value"),
      new ManualRewardRulePreferenceCodePrefixRule("Q"),
    ],
  );
}
