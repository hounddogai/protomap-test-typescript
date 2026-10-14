import * as text from "../../../../kit/text.js";
import { AdaptiveRewardRuleWindow } from "./adaptive-reward-rule-window.js";

/** A rule a adaptive reward rule window must pass. Check returns its problems, or none. */
export interface AdaptiveRewardRuleWindowRule {
  check(item: AdaptiveRewardRuleWindow): string[];
}

export class AdaptiveRewardRuleWindowAllowedCurrencyRule implements AdaptiveRewardRuleWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveRewardRuleWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is duplicated`];
    return [];
  }
}

export class AdaptiveRewardRuleWindowCodePrefixRule implements AdaptiveRewardRuleWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveRewardRuleWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveRewardRuleWindowBudgetRangeRule implements AdaptiveRewardRuleWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveRewardRuleWindow): string[] {
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

/** Runs every rule of a adaptive reward rule window. */
export class AdaptiveRewardRuleWindowValidator {
  rules: AdaptiveRewardRuleWindowRule[];

  constructor(rules: AdaptiveRewardRuleWindowRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveRewardRuleWindow): string[] {
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

  requireValid(item: AdaptiveRewardRuleWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveRewardRuleWindow[]): Map<string, string[]> {
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

export function defaultAdaptiveRewardRuleWindowValidator(): AdaptiveRewardRuleWindowValidator {
  return new AdaptiveRewardRuleWindowValidator(
    [
      new AdaptiveRewardRuleWindowAllowedCurrencyRule([]),
      new AdaptiveRewardRuleWindowCodePrefixRule("X"),
      new AdaptiveRewardRuleWindowBudgetRangeRule(7.7, 2008.4),
    ],
  );
}
