import { BidRulePolicy } from "./bid-rule-policy.js";

/** A rule a bid rule policy must pass. Check returns its problems, or none. */
export interface BidRulePolicyRule {
  check(item: BidRulePolicy): string[];
}

export class BidRulePolicyCurrencyLengthRule implements BidRulePolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRulePolicy): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRulePolicyRequiredTitleRule implements BidRulePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRulePolicy): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BidRulePolicyRequiredCurrencyRule implements BidRulePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRulePolicy): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class BidRulePolicyCodeLengthRule implements BidRulePolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRulePolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRulePolicyRevisionRangeRule implements BidRulePolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRulePolicy): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BidRulePolicyTitleLengthRule implements BidRulePolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRulePolicy): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a bid rule policy. */
export class BidRulePolicyValidator {
  rules: BidRulePolicyRule[];

  constructor(rules: BidRulePolicyRule[]) {
    this.rules = rules;
  }

  validate(item: BidRulePolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRulePolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRulePolicy[]): Map<string, string[]> {
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

export function defaultBidRulePolicyValidator(): BidRulePolicyValidator {
  return new BidRulePolicyValidator(
    [
      new BidRulePolicyCurrencyLengthRule(80),
      new BidRulePolicyRequiredTitleRule("bid rule policy needs an entry"),
      new BidRulePolicyRequiredCurrencyRule("bid rule policy needs a value"),
      new BidRulePolicyCodeLengthRule(120),
      new BidRulePolicyRevisionRangeRule(1000, 86400),
      new BidRulePolicyTitleLengthRule(64),
    ],
  );
}
