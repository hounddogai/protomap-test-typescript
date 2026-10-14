import { DefaultBounceMetric } from "./default-bounce-metric.js";

/** A rule a default bounce metric must pass. Check returns its problems, or none. */
export interface DefaultBounceMetricRule {
  check(item: DefaultBounceMetric): string[];
}

export class DefaultBounceMetricCodePrefixRule implements DefaultBounceMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultBounceMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultBounceMetricRegionLengthRule implements DefaultBounceMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultBounceMetric): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultBounceMetricRequiredCodeRule implements DefaultBounceMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultBounceMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultBounceMetricGraceDaysRangeRule implements DefaultBounceMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultBounceMetric): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultBounceMetricCodeLengthRule implements DefaultBounceMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultBounceMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultBounceMetricRequiredLabelRule implements DefaultBounceMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultBounceMetric): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default bounce metric. */
export class DefaultBounceMetricValidatorExtra {
  rules: DefaultBounceMetricRule[];

  constructor(rules: DefaultBounceMetricRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultBounceMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultBounceMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultBounceMetric[]): Map<string, string[]> {
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

export function defaultDefaultBounceMetricValidator(): DefaultBounceMetricValidatorExtra {
  return new DefaultBounceMetricValidatorExtra(
    [
      new DefaultBounceMetricCodePrefixRule("OPS"),
      new DefaultBounceMetricRegionLengthRule(16),
      new DefaultBounceMetricRequiredCodeRule("default bounce metric needs this field"),
      new DefaultBounceMetricGraceDaysRangeRule(16, 64),
      new DefaultBounceMetricCodeLengthRule(16),
      new DefaultBounceMetricRequiredLabelRule("default bounce metric needs a value"),
    ],
  );
}
