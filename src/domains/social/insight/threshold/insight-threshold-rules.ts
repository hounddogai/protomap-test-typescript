import { InsightThreshold } from "./insight-threshold.js";

/** A rule a insight threshold must pass. Check returns its problems, or none. */
export interface InsightThresholdRule {
  check(item: InsightThreshold): string[];
}

export class InsightThresholdCohortLengthRule implements InsightThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightThreshold): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightThresholdCodeLengthRule implements InsightThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightThresholdWindowDaysRangeRule implements InsightThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightThreshold): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a insight threshold. */
export class InsightThresholdValidator {
  rules: InsightThresholdRule[];

  constructor(rules: InsightThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: InsightThreshold): string[] {
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

  requireValid(item: InsightThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightThreshold[]): Map<string, string[]> {
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

export function defaultInsightThresholdValidator(): InsightThresholdValidator {
  return new InsightThresholdValidator(
    [
      new InsightThresholdCohortLengthRule(16),
      new InsightThresholdCodeLengthRule(120),
      new InsightThresholdWindowDaysRangeRule(255, 1000),
    ],
  );
}
