import { WeightedRewardRulePreference } from "./weighted-reward-rule-preference.js";

/** A rule a weighted reward rule preference must pass. Check returns its problems, or none. */
export interface WeightedRewardRulePreferenceRule {
  check(item: WeightedRewardRulePreference): string[];
}

export class WeightedRewardRulePreferenceUpdatedAtRangeRule implements WeightedRewardRulePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedRewardRulePreference): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedRewardRulePreferenceExternalRefLengthRule implements WeightedRewardRulePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedRewardRulePreference): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedRewardRulePreferenceCodePrefixRule implements WeightedRewardRulePreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedRewardRulePreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedRewardRulePreferenceCodeLengthRule implements WeightedRewardRulePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedRewardRulePreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted reward rule preference. */
export class WeightedRewardRulePreferenceValidator {
  rules: WeightedRewardRulePreferenceRule[];

  constructor(rules: WeightedRewardRulePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedRewardRulePreference): string[] {
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

  requireValid(item: WeightedRewardRulePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedRewardRulePreference[]): Map<string, string[]> {
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

export function defaultWeightedRewardRulePreferenceValidator(): WeightedRewardRulePreferenceValidator {
  return new WeightedRewardRulePreferenceValidator(
    [
      new WeightedRewardRulePreferenceUpdatedAtRangeRule(80, 120),
      new WeightedRewardRulePreferenceExternalRefLengthRule(86400),
      new WeightedRewardRulePreferenceCodePrefixRule("ACM"),
      new WeightedRewardRulePreferenceCodeLengthRule(120),
    ],
  );
}
