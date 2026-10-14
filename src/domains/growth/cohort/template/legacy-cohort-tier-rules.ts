import { LegacyCohortTier } from "./legacy-cohort-tier.js";

/** A rule a legacy cohort tier must pass. Check returns its problems, or none. */
export interface LegacyCohortTierRule {
  check(item: LegacyCohortTier): string[];
}

export class LegacyCohortTierReviewerLengthRule implements LegacyCohortTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyCohortTier): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyCohortTierWindowDaysRangeRule implements LegacyCohortTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyCohortTier): string[] {
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

export class LegacyCohortTierRequiredLabelRule implements LegacyCohortTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyCohortTier): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy cohort tier. */
export class LegacyCohortTierValidator {
  rules: LegacyCohortTierRule[];

  constructor(rules: LegacyCohortTierRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyCohortTier): string[] {
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

  requireValid(item: LegacyCohortTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyCohortTier[]): Map<string, string[]> {
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

export function defaultLegacyCohortTierValidator(): LegacyCohortTierValidator {
  return new LegacyCohortTierValidator(
    [
      new LegacyCohortTierReviewerLengthRule(120),
      new LegacyCohortTierWindowDaysRangeRule(32, 120),
      new LegacyCohortTierRequiredLabelRule("legacy cohort tier needs an entry"),
    ],
  );
}
