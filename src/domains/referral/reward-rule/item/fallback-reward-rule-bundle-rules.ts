import * as text from "../../../../kit/text.js";
import { FallbackRewardRuleBundle } from "./fallback-reward-rule-bundle.js";

/** A rule a fallback reward rule bundle must pass. Check returns its problems, or none. */
export interface FallbackRewardRuleBundleRule {
  check(item: FallbackRewardRuleBundle): string[];
}

export class FallbackRewardRuleBundleRequiredTitleRule implements FallbackRewardRuleBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackRewardRuleBundle): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackRewardRuleBundleAllowedCurrencyRule implements FallbackRewardRuleBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackRewardRuleBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is too long`];
    return [];
  }
}

export class FallbackRewardRuleBundleCategoryLengthRule implements FallbackRewardRuleBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackRewardRuleBundle): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackRewardRuleBundleRequiredCategoryRule implements FallbackRewardRuleBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackRewardRuleBundle): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackRewardRuleBundleCurrencyLengthRule implements FallbackRewardRuleBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackRewardRuleBundle): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback reward rule bundle. */
export class FallbackRewardRuleBundleValidator {
  rules: FallbackRewardRuleBundleRule[];

  constructor(rules: FallbackRewardRuleBundleRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackRewardRuleBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackRewardRuleBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackRewardRuleBundle[]): Map<string, string[]> {
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

export function defaultFallbackRewardRuleBundleValidator(): FallbackRewardRuleBundleValidator {
  return new FallbackRewardRuleBundleValidator(
    [
      new FallbackRewardRuleBundleRequiredTitleRule("fallback reward rule bundle needs a value"),
      new FallbackRewardRuleBundleAllowedCurrencyRule([]),
      new FallbackRewardRuleBundleCategoryLengthRule(16),
      new FallbackRewardRuleBundleRequiredCategoryRule("fallback reward rule bundle needs this field"),
      new FallbackRewardRuleBundleCurrencyLengthRule(64),
    ],
  );
}
