import { TieredWarmupClaim } from "./tiered-warmup-claim.js";

/** A rule a tiered warmup claim must pass. Check returns its problems, or none. */
export interface TieredWarmupClaimRule {
  check(item: TieredWarmupClaim): string[];
}

export class TieredWarmupClaimLabelLengthRule implements TieredWarmupClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredWarmupClaim): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredWarmupClaimCategoryLengthRule implements TieredWarmupClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredWarmupClaim): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredWarmupClaimCostRangeRule implements TieredWarmupClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredWarmupClaim): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered warmup claim. */
export class TieredWarmupClaimValidator {
  rules: TieredWarmupClaimRule[];

  constructor(rules: TieredWarmupClaimRule[]) {
    this.rules = rules;
  }

  validate(item: TieredWarmupClaim): string[] {
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

  requireValid(item: TieredWarmupClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredWarmupClaim[]): Map<string, string[]> {
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

export function defaultTieredWarmupClaimValidator(): TieredWarmupClaimValidator {
  return new TieredWarmupClaimValidator(
    [
      new TieredWarmupClaimLabelLengthRule(80),
      new TieredWarmupClaimCategoryLengthRule(3600),
      new TieredWarmupClaimCostRangeRule(5, 1887),
    ],
  );
}
