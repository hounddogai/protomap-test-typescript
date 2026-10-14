import * as text from "../../../../kit/text.js";
import { WeightedOptOutRule } from "./weighted-opt-out-rule.js";

/** A rule a weighted opt out rule must pass. Check returns its problems, or none. */
export interface WeightedOptOutRuleRule {
  check(item: WeightedOptOutRule): string[];
}

export class WeightedOptOutRuleSourceLengthRule implements WeightedOptOutRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedOptOutRule): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedOptOutRuleCostRangeRule implements WeightedOptOutRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedOptOutRule): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedOptOutRuleAllowedCodeRule implements WeightedOptOutRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedOptOutRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class WeightedOptOutRuleRequiredNameRule implements WeightedOptOutRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedOptOutRule): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted opt out rule. */
export class WeightedOptOutRuleValidator {
  rules: WeightedOptOutRuleRule[];

  constructor(rules: WeightedOptOutRuleRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedOptOutRule): string[] {
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

  requireValid(item: WeightedOptOutRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedOptOutRule[]): Map<string, string[]> {
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

export function defaultWeightedOptOutRuleValidator(): WeightedOptOutRuleValidator {
  return new WeightedOptOutRuleValidator(
    [
      new WeightedOptOutRuleSourceLengthRule(255),
      new WeightedOptOutRuleCostRangeRule(1.2, 444.4),
      new WeightedOptOutRuleAllowedCodeRule(["default", "rolling", "legacy"]),
      new WeightedOptOutRuleRequiredNameRule("weighted opt out rule needs this field"),
    ],
  );
}
