import * as text from "../../../../kit/text.js";
import { BidRuleTier } from "./bid-rule-tier.js";

/** A rule a bid rule tier must pass. Check returns its problems, or none. */
export interface BidRuleTierRule {
  check(item: BidRuleTier): string[];
}

export class BidRuleTierAttemptsRangeRule implements BidRuleTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleTier): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BidRuleTierCodePrefixRule implements BidRuleTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BidRuleTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BidRuleTierLocaleLengthRule implements BidRuleTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleTier): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleTierAllowedLocaleRule implements BidRuleTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BidRuleTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is unknown`];
    return [];
  }
}

export class BidRuleTierRequiredNameRule implements BidRuleTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleTier): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleTierBudgetRangeRule implements BidRuleTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleTier): string[] {
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

/** Runs every rule of a bid rule tier. */
export class BidRuleTierValidator {
  rules: BidRuleTierRule[];

  constructor(rules: BidRuleTierRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleTier[]): Map<string, string[]> {
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

export function defaultBidRuleTierValidator(): BidRuleTierValidator {
  return new BidRuleTierValidator(
    [
      new BidRuleTierAttemptsRangeRule(255, 1000),
      new BidRuleTierCodePrefixRule("X"),
      new BidRuleTierLocaleLengthRule(16),
      new BidRuleTierAllowedLocaleRule([]),
      new BidRuleTierRequiredNameRule("bid rule tier needs an entry"),
      new BidRuleTierBudgetRangeRule(4.1, 4358.7),
    ],
  );
}
