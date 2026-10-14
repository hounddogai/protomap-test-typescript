import { LegacyBounceMetric } from "./legacy-bounce-metric.js";

/** A rule a legacy bounce metric must pass. Check returns its problems, or none. */
export interface LegacyBounceMetricRule {
  check(item: LegacyBounceMetric): string[];
}

export class LegacyBounceMetricRequiredUtmSourceRule implements LegacyBounceMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyBounceMetric): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyBounceMetricChannelLengthRule implements LegacyBounceMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyBounceMetric): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyBounceMetricDiscountRangeRule implements LegacyBounceMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyBounceMetric): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy bounce metric. */
export class LegacyBounceMetricValidator {
  rules: LegacyBounceMetricRule[];

  constructor(rules: LegacyBounceMetricRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyBounceMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyBounceMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyBounceMetric[]): Map<string, string[]> {
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

export function defaultLegacyBounceMetricValidator(): LegacyBounceMetricValidator {
  return new LegacyBounceMetricValidator(
    [
      new LegacyBounceMetricRequiredUtmSourceRule("legacy bounce metric needs this field"),
      new LegacyBounceMetricChannelLengthRule(255),
      new LegacyBounceMetricDiscountRangeRule(6.1, 2661.1),
    ],
  );
}
