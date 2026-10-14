import * as text from "../../../../kit/text.js";
import { ManualRewardRuleMetric } from "./manual-reward-rule-metric.js";

/** A rule a manual reward rule metric must pass. Check returns its problems, or none. */
export interface ManualRewardRuleMetricRule {
  check(item: ManualRewardRuleMetric): string[];
}

export class ManualRewardRuleMetricCodePrefixRule implements ManualRewardRuleMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualRewardRuleMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualRewardRuleMetricCategoryLengthRule implements ManualRewardRuleMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRewardRuleMetric): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualRewardRuleMetricAllowedLabelRule implements ManualRewardRuleMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualRewardRuleMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is unknown`];
    return [];
  }
}

export class ManualRewardRuleMetricBudgetRangeRule implements ManualRewardRuleMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualRewardRuleMetric): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualRewardRuleMetricTimezoneLengthRule implements ManualRewardRuleMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRewardRuleMetric): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualRewardRuleMetricRequiredCategoryRule implements ManualRewardRuleMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualRewardRuleMetric): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual reward rule metric. */
export class ManualRewardRuleMetricValidator {
  rules: ManualRewardRuleMetricRule[];

  constructor(rules: ManualRewardRuleMetricRule[]) {
    this.rules = rules;
  }

  validate(item: ManualRewardRuleMetric): string[] {
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

  requireValid(item: ManualRewardRuleMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualRewardRuleMetric[]): Map<string, string[]> {
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

export function defaultManualRewardRuleMetricValidator(): ManualRewardRuleMetricValidator {
  return new ManualRewardRuleMetricValidator(
    [
      new ManualRewardRuleMetricCodePrefixRule("OPS"),
      new ManualRewardRuleMetricCategoryLengthRule(120),
      new ManualRewardRuleMetricAllowedLabelRule(["lenient", "regional"]),
      new ManualRewardRuleMetricBudgetRangeRule(8.9, 3854.9),
      new ManualRewardRuleMetricTimezoneLengthRule(16),
      new ManualRewardRuleMetricRequiredCategoryRule("manual reward rule metric needs an entry"),
    ],
  );
}
