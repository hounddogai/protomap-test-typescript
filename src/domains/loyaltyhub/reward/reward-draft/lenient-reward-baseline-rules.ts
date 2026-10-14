import { LenientRewardBaseline } from "./lenient-reward-baseline.js";

/** A rule a lenient reward baseline must pass. Check returns its problems, or none. */
export interface LenientRewardBaselineRule {
  check(item: LenientRewardBaseline): string[];
}

export class LenientRewardBaselineGraceDaysRangeRule implements LenientRewardBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientRewardBaseline): string[] {
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

export class LenientRewardBaselineCodeLengthRule implements LenientRewardBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRewardBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientRewardBaselineExpiresAtRangeRule implements LenientRewardBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientRewardBaseline): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient reward baseline. */
export class LenientRewardBaselineValidator {
  rules: LenientRewardBaselineRule[];

  constructor(rules: LenientRewardBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: LenientRewardBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientRewardBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientRewardBaseline[]): Map<string, string[]> {
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

export function defaultLenientRewardBaselineValidator(): LenientRewardBaselineValidator {
  return new LenientRewardBaselineValidator(
    [
      new LenientRewardBaselineGraceDaysRangeRule(32, 80),
      new LenientRewardBaselineCodeLengthRule(86400),
      new LenientRewardBaselineExpiresAtRangeRule(80, 86400),
    ],
  );
}
