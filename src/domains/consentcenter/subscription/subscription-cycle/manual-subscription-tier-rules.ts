import { ManualSubscriptionTier } from "./manual-subscription-tier.js";

/** A rule a manual subscription tier must pass. Check returns its problems, or none. */
export interface ManualSubscriptionTierRule {
  check(item: ManualSubscriptionTier): string[];
}

export class ManualSubscriptionTierRequiredUnitRule implements ManualSubscriptionTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualSubscriptionTier): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class ManualSubscriptionTierCodePrefixRule implements ManualSubscriptionTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualSubscriptionTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualSubscriptionTierWindowDaysRangeRule implements ManualSubscriptionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualSubscriptionTier): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a manual subscription tier. */
export class ManualSubscriptionTierValidator {
  rules: ManualSubscriptionTierRule[];

  constructor(rules: ManualSubscriptionTierRule[]) {
    this.rules = rules;
  }

  validate(item: ManualSubscriptionTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualSubscriptionTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualSubscriptionTier[]): Map<string, string[]> {
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

export function defaultManualSubscriptionTierValidator(): ManualSubscriptionTierValidator {
  return new ManualSubscriptionTierValidator(
    [
      new ManualSubscriptionTierRequiredUnitRule("manual subscription tier needs this field"),
      new ManualSubscriptionTierCodePrefixRule("REF"),
      new ManualSubscriptionTierWindowDaysRangeRule(80, 120),
    ],
  );
}
