import { WeightedRewardRuleGroup } from "./weighted-reward-rule-group.js";

/** A rule a weighted reward rule group must pass. Check returns its problems, or none. */
export interface WeightedRewardRuleGroupRule {
  check(item: WeightedRewardRuleGroup): string[];
}

export class WeightedRewardRuleGroupStartsAtRangeRule implements WeightedRewardRuleGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedRewardRuleGroup): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedRewardRuleGroupActiveGuardRule implements WeightedRewardRuleGroupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WeightedRewardRuleGroup): string[] {
    if (item.active && item.startsAt > this.limit) return [`starts at ${item.startsAt} exceeds ${this.limit} while active`];
    return [];
  }
}

export class WeightedRewardRuleGroupBudgetRangeRule implements WeightedRewardRuleGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedRewardRuleGroup): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedRewardRuleGroupLabelLengthRule implements WeightedRewardRuleGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedRewardRuleGroup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedRewardRuleGroupCodeLengthRule implements WeightedRewardRuleGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedRewardRuleGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedRewardRuleGroupCodePrefixRule implements WeightedRewardRuleGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedRewardRuleGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a weighted reward rule group. */
export class WeightedRewardRuleGroupValidator {
  rules: WeightedRewardRuleGroupRule[];

  constructor(rules: WeightedRewardRuleGroupRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedRewardRuleGroup): string[] {
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

  requireValid(item: WeightedRewardRuleGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedRewardRuleGroup[]): Map<string, string[]> {
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

export function defaultWeightedRewardRuleGroupValidator(): WeightedRewardRuleGroupValidator {
  return new WeightedRewardRuleGroupValidator(
    [
      new WeightedRewardRuleGroupStartsAtRangeRule(80, 255),
      new WeightedRewardRuleGroupActiveGuardRule(80),
      new WeightedRewardRuleGroupBudgetRangeRule(5.3, 3173.2),
      new WeightedRewardRuleGroupLabelLengthRule(80),
      new WeightedRewardRuleGroupCodeLengthRule(255),
      new WeightedRewardRuleGroupCodePrefixRule("OPS"),
    ],
  );
}
