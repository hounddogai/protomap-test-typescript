import { SeasonalSubscriptionTier } from "./seasonal-subscription-tier.js";

/** A rule a seasonal subscription tier must pass. Check returns its problems, or none. */
export interface SeasonalSubscriptionTierRule {
  check(item: SeasonalSubscriptionTier): string[];
}

export class SeasonalSubscriptionTierCodePrefixRule implements SeasonalSubscriptionTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalSubscriptionTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalSubscriptionTierUpdatedAtRangeRule implements SeasonalSubscriptionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalSubscriptionTier): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalSubscriptionTierLimitRangeRule implements SeasonalSubscriptionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalSubscriptionTier): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalSubscriptionTierPriorityRangeRule implements SeasonalSubscriptionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalSubscriptionTier): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a seasonal subscription tier. */
export class SeasonalSubscriptionTierValidator {
  rules: SeasonalSubscriptionTierRule[];

  constructor(rules: SeasonalSubscriptionTierRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalSubscriptionTier): string[] {
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

  requireValid(item: SeasonalSubscriptionTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalSubscriptionTier[]): Map<string, string[]> {
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

export function defaultSeasonalSubscriptionTierValidator(): SeasonalSubscriptionTierValidator {
  return new SeasonalSubscriptionTierValidator(
    [
      new SeasonalSubscriptionTierCodePrefixRule("OPS"),
      new SeasonalSubscriptionTierUpdatedAtRangeRule(16, 86400),
      new SeasonalSubscriptionTierLimitRangeRule(32, 255),
      new SeasonalSubscriptionTierPriorityRangeRule(32, 3600),
    ],
  );
}
