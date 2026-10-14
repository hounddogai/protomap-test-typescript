import { StrictRedemptionException } from "./strict-redemption-exception.js";

/** A rule a strict redemption exception must pass. Check returns its problems, or none. */
export interface StrictRedemptionExceptionRule {
  check(item: StrictRedemptionException): string[];
}

export class StrictRedemptionExceptionBudgetRangeRule implements StrictRedemptionExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictRedemptionException): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictRedemptionExceptionPriorityRangeRule implements StrictRedemptionExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictRedemptionException): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictRedemptionExceptionCohortLengthRule implements StrictRedemptionExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRedemptionException): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict redemption exception. */
export class StrictRedemptionExceptionValidator {
  rules: StrictRedemptionExceptionRule[];

  constructor(rules: StrictRedemptionExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: StrictRedemptionException): string[] {
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

  requireValid(item: StrictRedemptionException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictRedemptionException[]): Map<string, string[]> {
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

export function defaultStrictRedemptionExceptionValidator(): StrictRedemptionExceptionValidator {
  return new StrictRedemptionExceptionValidator(
    [
      new StrictRedemptionExceptionBudgetRangeRule(8.1, 4092.3),
      new StrictRedemptionExceptionPriorityRangeRule(3600, 3600),
      new StrictRedemptionExceptionCohortLengthRule(32),
    ],
  );
}
