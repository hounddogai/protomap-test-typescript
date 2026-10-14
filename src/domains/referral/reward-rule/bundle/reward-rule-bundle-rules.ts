import * as text from "../../../../kit/text.js";
import { RewardRuleBundle } from "./reward-rule-bundle.js";

/** A rule a reward rule bundle must pass. Check returns its problems, or none. */
export interface RewardRuleBundleRule {
  check(item: RewardRuleBundle): string[];
}

export class RewardRuleBundleCodePrefixRule implements RewardRuleBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardRuleBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RewardRuleBundleRequiredReviewerRule implements RewardRuleBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleBundle): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleBundleAllowedLocaleRule implements RewardRuleBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardRuleBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is unknown`];
    return [];
  }
}

export class RewardRuleBundleImpressionsRangeRule implements RewardRuleBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleBundle): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardRuleBundleTitleLengthRule implements RewardRuleBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleBundle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleBundleRequiredNameRule implements RewardRuleBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleBundle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reward rule bundle. */
export class RewardRuleBundleValidator {
  rules: RewardRuleBundleRule[];

  constructor(rules: RewardRuleBundleRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardRuleBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleBundle[]): Map<string, string[]> {
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

export function defaultRewardRuleBundleValidator(): RewardRuleBundleValidator {
  return new RewardRuleBundleValidator(
    [
      new RewardRuleBundleCodePrefixRule("OPS"),
      new RewardRuleBundleRequiredReviewerRule("reward rule bundle needs a value"),
      new RewardRuleBundleAllowedLocaleRule([]),
      new RewardRuleBundleImpressionsRangeRule(80, 120),
      new RewardRuleBundleTitleLengthRule(80),
      new RewardRuleBundleRequiredNameRule("reward rule bundle needs an entry"),
    ],
  );
}
