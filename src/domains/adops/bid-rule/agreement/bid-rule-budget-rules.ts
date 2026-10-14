import * as text from "../../../../kit/text.js";
import { BidRuleBudget } from "./bid-rule-budget.js";

/** A rule a bid rule budget must pass. Check returns its problems, or none. */
export interface BidRuleBudgetRule {
  check(item: BidRuleBudget): string[];
}

export class BidRuleBudgetAllowedRegionRule implements BidRuleBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BidRuleBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is missing`];
    return [];
  }
}

export class BidRuleBudgetRequiredCodeRule implements BidRuleBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleBudgetRequiredRegionRule implements BidRuleBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleBudget): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleBudgetRevisionRangeRule implements BidRuleBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleBudget): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BidRuleBudgetCodeLengthRule implements BidRuleBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleBudgetCodePrefixRule implements BidRuleBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BidRuleBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a bid rule budget. */
export class BidRuleBudgetValidator {
  rules: BidRuleBudgetRule[];

  constructor(rules: BidRuleBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleBudget): string[] {
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

  requireValid(item: BidRuleBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleBudget[]): Map<string, string[]> {
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

export function defaultBidRuleBudgetValidator(): BidRuleBudgetValidator {
  return new BidRuleBudgetValidator(
    [
      new BidRuleBudgetAllowedRegionRule(["regional"]),
      new BidRuleBudgetRequiredCodeRule("bid rule budget needs this field"),
      new BidRuleBudgetRequiredRegionRule("bid rule budget needs an entry"),
      new BidRuleBudgetRevisionRangeRule(1000, 1000),
      new BidRuleBudgetCodeLengthRule(86400),
      new BidRuleBudgetCodePrefixRule("REF"),
    ],
  );
}
