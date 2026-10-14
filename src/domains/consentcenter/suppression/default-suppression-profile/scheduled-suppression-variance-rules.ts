import { ScheduledSuppressionVariance } from "./scheduled-suppression-variance.js";

/** A rule a scheduled suppression variance must pass. Check returns its problems, or none. */
export interface ScheduledSuppressionVarianceRule {
  check(item: ScheduledSuppressionVariance): string[];
}

export class ScheduledSuppressionVarianceCodeLengthRule implements ScheduledSuppressionVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSuppressionVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSuppressionVarianceBudgetRangeRule implements ScheduledSuppressionVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledSuppressionVariance): string[] {
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

export class ScheduledSuppressionVarianceVariantLengthRule implements ScheduledSuppressionVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSuppressionVariance): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled suppression variance. */
export class ScheduledSuppressionVarianceValidator {
  rules: ScheduledSuppressionVarianceRule[];

  constructor(rules: ScheduledSuppressionVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledSuppressionVariance): string[] {
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

  requireValid(item: ScheduledSuppressionVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledSuppressionVariance[]): Map<string, string[]> {
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

export function defaultScheduledSuppressionVarianceValidator(): ScheduledSuppressionVarianceValidator {
  return new ScheduledSuppressionVarianceValidator(
    [
      new ScheduledSuppressionVarianceCodeLengthRule(1000),
      new ScheduledSuppressionVarianceBudgetRangeRule(3.1, 2727.2),
      new ScheduledSuppressionVarianceVariantLengthRule(120),
    ],
  );
}
