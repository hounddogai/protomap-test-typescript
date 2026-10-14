import { TieredRedemptionGroup } from "./tiered-redemption-group.js";

/** A rule a tiered redemption group must pass. Check returns its problems, or none. */
export interface TieredRedemptionGroupRule {
  check(item: TieredRedemptionGroup): string[];
}

export class TieredRedemptionGroupMinimumRangeRule implements TieredRedemptionGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredRedemptionGroup): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredRedemptionGroupCodeLengthRule implements TieredRedemptionGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRedemptionGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredRedemptionGroupCostRangeRule implements TieredRedemptionGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredRedemptionGroup): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredRedemptionGroupReviewerLengthRule implements TieredRedemptionGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRedemptionGroup): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredRedemptionGroupRequiredJourneyIdRule implements TieredRedemptionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRedemptionGroup): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRedemptionGroupRequiredTitleRule implements TieredRedemptionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRedemptionGroup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered redemption group. */
export class TieredRedemptionGroupValidator {
  rules: TieredRedemptionGroupRule[];

  constructor(rules: TieredRedemptionGroupRule[]) {
    this.rules = rules;
  }

  validate(item: TieredRedemptionGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredRedemptionGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredRedemptionGroup[]): Map<string, string[]> {
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

export function defaultTieredRedemptionGroupValidator(): TieredRedemptionGroupValidator {
  return new TieredRedemptionGroupValidator(
    [
      new TieredRedemptionGroupMinimumRangeRule(8.3, 3381.6),
      new TieredRedemptionGroupCodeLengthRule(3600),
      new TieredRedemptionGroupCostRangeRule(7.7, 131.8),
      new TieredRedemptionGroupReviewerLengthRule(16),
      new TieredRedemptionGroupRequiredJourneyIdRule("tiered redemption group needs this field"),
      new TieredRedemptionGroupRequiredTitleRule("tiered redemption group needs this field"),
    ],
  );
}
