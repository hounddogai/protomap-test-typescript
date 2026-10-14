import { SubscriptionTier } from "./subscription-tier.js";

/** A rule a subscription tier must pass. Check returns its problems, or none. */
export interface SubscriptionTierRule {
  check(item: SubscriptionTier): string[];
}

export class SubscriptionTierVisibleGuardRule implements SubscriptionTierRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SubscriptionTier): string[] {
    if (item.visible && item.frequencyCap > this.limit) return [`frequency cap ${item.frequencyCap} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class SubscriptionTierFrequencyCapRangeRule implements SubscriptionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionTier): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionTierBudgetRangeRule implements SubscriptionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionTier): string[] {
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

/** Runs every rule of a subscription tier. */
export class SubscriptionTierValidator {
  rules: SubscriptionTierRule[];

  constructor(rules: SubscriptionTierRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionTier[]): Map<string, string[]> {
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

export function defaultSubscriptionTierValidator(): SubscriptionTierValidator {
  return new SubscriptionTierValidator(
    [
      new SubscriptionTierVisibleGuardRule(16),
      new SubscriptionTierFrequencyCapRangeRule(16, 1000),
      new SubscriptionTierBudgetRangeRule(3.3, 895.5),
    ],
  );
}
