import { DefaultEscalationMetric } from "./default-escalation-metric.js";

/** A rule a default escalation metric must pass. Check returns its problems, or none. */
export interface DefaultEscalationMetricRule {
  check(item: DefaultEscalationMetric): string[];
}

export class DefaultEscalationMetricExpiresAtRangeRule implements DefaultEscalationMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultEscalationMetric): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultEscalationMetricBidRangeRule implements DefaultEscalationMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultEscalationMetric): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultEscalationMetricTitleLengthRule implements DefaultEscalationMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultEscalationMetric): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultEscalationMetricFrequencyCapRangeRule implements DefaultEscalationMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultEscalationMetric): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a default escalation metric. */
export class DefaultEscalationMetricValidator {
  rules: DefaultEscalationMetricRule[];

  constructor(rules: DefaultEscalationMetricRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultEscalationMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultEscalationMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultEscalationMetric[]): Map<string, string[]> {
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

export function defaultDefaultEscalationMetricValidator(): DefaultEscalationMetricValidator {
  return new DefaultEscalationMetricValidator(
    [
      new DefaultEscalationMetricExpiresAtRangeRule(64, 1000),
      new DefaultEscalationMetricBidRangeRule(3.7, 2104.4),
      new DefaultEscalationMetricTitleLengthRule(16),
      new DefaultEscalationMetricFrequencyCapRangeRule(64, 80),
    ],
  );
}
