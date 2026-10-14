import * as text from "../../../../kit/text.js";
import { BidRuleEstimate } from "./bid-rule-estimate.js";

/** A rule a bid rule estimate must pass. Check returns its problems, or none. */
export interface BidRuleEstimateRule {
  check(item: BidRuleEstimate): string[];
}

export class BidRuleEstimateAllowedExternalRefRule implements BidRuleEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BidRuleEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is out of range`];
    return [];
  }
}

export class BidRuleEstimateRequiredNameRule implements BidRuleEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleEstimate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleEstimateAmountRangeRule implements BidRuleEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleEstimate): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a bid rule estimate. */
export class BidRuleEstimateValidator {
  rules: BidRuleEstimateRule[];

  constructor(rules: BidRuleEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleEstimate): string[] {
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

  requireValid(item: BidRuleEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleEstimate[]): Map<string, string[]> {
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

export function defaultBidRuleEstimateValidator(): BidRuleEstimateValidator {
  return new BidRuleEstimateValidator(
    [
      new BidRuleEstimateAllowedExternalRefRule([]),
      new BidRuleEstimateRequiredNameRule("bid rule estimate needs an entry"),
      new BidRuleEstimateAmountRangeRule(8.2, 1349.5),
    ],
  );
}
