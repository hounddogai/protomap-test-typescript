import * as text from "../../../../kit/text.js";
import { TieredCreditTier } from "./tiered-credit-tier.js";

/** A rule a tiered credit tier must pass. Check returns its problems, or none. */
export interface TieredCreditTierRule {
  check(item: TieredCreditTier): string[];
}

export class TieredCreditTierMarginRangeRule implements TieredCreditTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredCreditTier): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredCreditTierAllowedCurrencyRule implements TieredCreditTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredCreditTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is below minimum`];
    return [];
  }
}

export class TieredCreditTierScoreRangeRule implements TieredCreditTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredCreditTier): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered credit tier. */
export class TieredCreditTierValidator {
  rules: TieredCreditTierRule[];

  constructor(rules: TieredCreditTierRule[]) {
    this.rules = rules;
  }

  validate(item: TieredCreditTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredCreditTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredCreditTier[]): Map<string, string[]> {
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

export function defaultTieredCreditTierValidator(): TieredCreditTierValidator {
  return new TieredCreditTierValidator(
    [
      new TieredCreditTierMarginRangeRule(5.7, 985.7),
      new TieredCreditTierAllowedCurrencyRule([]),
      new TieredCreditTierScoreRangeRule(5, 4498.6),
    ],
  );
}
