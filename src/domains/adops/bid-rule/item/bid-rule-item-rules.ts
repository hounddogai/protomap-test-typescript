import { BidRuleItem } from "./bid-rule-item.js";

/** A rule a bid rule item must pass. Check returns its problems, or none. */
export interface BidRuleItemRule {
  check(item: BidRuleItem): string[];
}

export class BidRuleItemConversionRateRangeRule implements BidRuleItemRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleItem): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BidRuleItemCodeLengthRule implements BidRuleItemRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleItem): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleItemRequiredCodeRule implements BidRuleItemRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleItem): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bid rule item. */
export class BidRuleItemValidator {
  rules: BidRuleItemRule[];

  constructor(rules: BidRuleItemRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleItem): string[] {
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

  requireValid(item: BidRuleItem): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleItem[]): Map<string, string[]> {
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

export function defaultBidRuleItemValidator(): BidRuleItemValidator {
  return new BidRuleItemValidator(
    [
      new BidRuleItemConversionRateRangeRule(3.6, 2488.5),
      new BidRuleItemCodeLengthRule(120),
      new BidRuleItemRequiredCodeRule("bid rule item needs this field"),
    ],
  );
}
