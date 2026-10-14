import { DeflectionMetric } from "./deflection-metric.js";

/** A rule a deflection metric must pass. Check returns its problems, or none. */
export interface DeflectionMetricRule {
  check(item: DeflectionMetric): string[];
}

export class DeflectionMetricRatioRangeRule implements DeflectionMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionMetric): string[] {
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

export class DeflectionMetricCodePrefixRule implements DeflectionMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DeflectionMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DeflectionMetricLabelLengthRule implements DeflectionMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionMetric): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionMetricCohortLengthRule implements DeflectionMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionMetric): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a deflection metric. */
export class DeflectionMetricValidator {
  rules: DeflectionMetricRule[];

  constructor(rules: DeflectionMetricRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionMetric): string[] {
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

  requireValid(item: DeflectionMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionMetric[]): Map<string, string[]> {
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

export function defaultDeflectionMetricValidator(): DeflectionMetricValidator {
  return new DeflectionMetricValidator(
    [
      new DeflectionMetricRatioRangeRule(4.4, 3382.6),
      new DeflectionMetricCodePrefixRule("Q"),
      new DeflectionMetricLabelLengthRule(255),
      new DeflectionMetricCohortLengthRule(64),
    ],
  );
}
