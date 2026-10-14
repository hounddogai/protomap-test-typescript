import { ScheduledDeflectionMetric } from "./scheduled-deflection-metric.js";

/** A rule a scheduled deflection metric must pass. Check returns its problems, or none. */
export interface ScheduledDeflectionMetricRule {
  check(item: ScheduledDeflectionMetric): string[];
}

export class ScheduledDeflectionMetricRatioRangeRule implements ScheduledDeflectionMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledDeflectionMetric): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledDeflectionMetricLabelLengthRule implements ScheduledDeflectionMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDeflectionMetric): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledDeflectionMetricRequiredLabelRule implements ScheduledDeflectionMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledDeflectionMetric): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled deflection metric. */
export class ScheduledDeflectionMetricValidator {
  rules: ScheduledDeflectionMetricRule[];

  constructor(rules: ScheduledDeflectionMetricRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledDeflectionMetric): string[] {
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

  requireValid(item: ScheduledDeflectionMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledDeflectionMetric[]): Map<string, string[]> {
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

export function defaultScheduledDeflectionMetricValidator(): ScheduledDeflectionMetricValidator {
  return new ScheduledDeflectionMetricValidator(
    [
      new ScheduledDeflectionMetricRatioRangeRule(9, 4767.9),
      new ScheduledDeflectionMetricLabelLengthRule(64),
      new ScheduledDeflectionMetricRequiredLabelRule("scheduled deflection metric needs a value"),
    ],
  );
}
