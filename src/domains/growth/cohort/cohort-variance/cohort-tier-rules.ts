import { CohortTier } from "./cohort-tier.js";

/** A rule a cohort tier must pass. Check returns its problems, or none. */
export interface CohortTierRule {
  check(item: CohortTier): string[];
}

export class CohortTierLabelLengthRule implements CohortTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortTier): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortTierRateRangeRule implements CohortTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortTier): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CohortTierWindowDaysRangeRule implements CohortTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortTier): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CohortTierChannelLengthRule implements CohortTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortTier): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortTierCodeLengthRule implements CohortTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a cohort tier. */
export class CohortTierValidator {
  rules: CohortTierRule[];

  constructor(rules: CohortTierRule[]) {
    this.rules = rules;
  }

  validate(item: CohortTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CohortTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortTier[]): Map<string, string[]> {
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

export function defaultCohortTierValidator(): CohortTierValidator {
  return new CohortTierValidator(
    [
      new CohortTierLabelLengthRule(255),
      new CohortTierRateRangeRule(8.8, 3670.3),
      new CohortTierWindowDaysRangeRule(64, 80),
      new CohortTierChannelLengthRule(64),
      new CohortTierCodeLengthRule(255),
    ],
  );
}
