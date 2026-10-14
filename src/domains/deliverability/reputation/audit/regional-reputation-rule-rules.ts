import * as text from "../../../../kit/text.js";
import { RegionalReputationRule } from "./regional-reputation-rule.js";

/** A rule a regional reputation rule must pass. Check returns its problems, or none. */
export interface RegionalReputationRuleRule {
  check(item: RegionalReputationRule): string[];
}

export class RegionalReputationRuleRequiredCurrencyRule implements RegionalReputationRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalReputationRule): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalReputationRuleAllowedCodeRule implements RegionalReputationRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalReputationRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class RegionalReputationRuleCurrencyLengthRule implements RegionalReputationRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalReputationRule): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalReputationRuleClicksRangeRule implements RegionalReputationRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalReputationRule): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalReputationRuleRequiredLabelRule implements RegionalReputationRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalReputationRule): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional reputation rule. */
export class RegionalReputationRuleValidator {
  rules: RegionalReputationRuleRule[];

  constructor(rules: RegionalReputationRuleRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalReputationRule): string[] {
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

  requireValid(item: RegionalReputationRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalReputationRule[]): Map<string, string[]> {
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

export function defaultRegionalReputationRuleValidator(): RegionalReputationRuleValidator {
  return new RegionalReputationRuleValidator(
    [
      new RegionalReputationRuleRequiredCurrencyRule("regional reputation rule needs an entry"),
      new RegionalReputationRuleAllowedCodeRule(["capped"]),
      new RegionalReputationRuleCurrencyLengthRule(1000),
      new RegionalReputationRuleClicksRangeRule(32, 120),
      new RegionalReputationRuleRequiredLabelRule("regional reputation rule needs an entry"),
    ],
  );
}
