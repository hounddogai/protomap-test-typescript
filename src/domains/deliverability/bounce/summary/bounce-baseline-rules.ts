import { BounceBaseline } from "./bounce-baseline.js";

/** A rule a bounce baseline must pass. Check returns its problems, or none. */
export interface BounceBaselineRule {
  check(item: BounceBaseline): string[];
}

export class BounceBaselineGraceDaysRangeRule implements BounceBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BounceBaseline): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BounceBaselineMarginRangeRule implements BounceBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BounceBaseline): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BounceBaselineTitleLengthRule implements BounceBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceBaseline): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceBaselineRetriesRangeRule implements BounceBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BounceBaseline): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a bounce baseline. */
export class BounceBaselineValidator {
  rules: BounceBaselineRule[];

  constructor(rules: BounceBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: BounceBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BounceBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceBaseline[]): Map<string, string[]> {
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

export function defaultBounceBaselineValidator(): BounceBaselineValidator {
  return new BounceBaselineValidator(
    [
      new BounceBaselineGraceDaysRangeRule(16, 32),
      new BounceBaselineMarginRangeRule(6.3, 3015.1),
      new BounceBaselineTitleLengthRule(80),
      new BounceBaselineRetriesRangeRule(255, 1000),
    ],
  );
}
