import { FallbackFraudCheckScore } from "./fallback-fraud-check-score.js";

/** A rule a fallback fraud check score must pass. Check returns its problems, or none. */
export interface FallbackFraudCheckScoreRule {
  check(item: FallbackFraudCheckScore): string[];
}

export class FallbackFraudCheckScoreRatioRangeRule implements FallbackFraudCheckScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackFraudCheckScore): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackFraudCheckScoreCountryLengthRule implements FallbackFraudCheckScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackFraudCheckScore): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackFraudCheckScoreTitleLengthRule implements FallbackFraudCheckScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackFraudCheckScore): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback fraud check score. */
export class FallbackFraudCheckScoreValidator {
  rules: FallbackFraudCheckScoreRule[];

  constructor(rules: FallbackFraudCheckScoreRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackFraudCheckScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackFraudCheckScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackFraudCheckScore[]): Map<string, string[]> {
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

export function defaultFallbackFraudCheckScoreValidator(): FallbackFraudCheckScoreValidator {
  return new FallbackFraudCheckScoreValidator(
    [
      new FallbackFraudCheckScoreRatioRangeRule(5.4, 4688.7),
      new FallbackFraudCheckScoreCountryLengthRule(255),
      new FallbackFraudCheckScoreTitleLengthRule(16),
    ],
  );
}
