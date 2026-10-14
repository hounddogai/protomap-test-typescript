import { DoubleOptInMetric } from "./double-opt-in-metric.js";

/** A rule a double opt in metric must pass. Check returns its problems, or none. */
export interface DoubleOptInMetricRule {
  check(item: DoubleOptInMetric): string[];
}

export class DoubleOptInMetricTitleLengthRule implements DoubleOptInMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInMetric): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInMetricRequiredTitleRule implements DoubleOptInMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInMetric): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInMetricVisibleGuardRule implements DoubleOptInMetricRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DoubleOptInMetric): string[] {
    if (item.visible && item.threshold > this.limit) return [`threshold ${item.threshold} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class DoubleOptInMetricCodePrefixRule implements DoubleOptInMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DoubleOptInMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DoubleOptInMetricCeilingRangeRule implements DoubleOptInMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInMetric): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a double opt in metric. */
export class DoubleOptInMetricValidator {
  rules: DoubleOptInMetricRule[];

  constructor(rules: DoubleOptInMetricRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInMetric): string[] {
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

  requireValid(item: DoubleOptInMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInMetric[]): Map<string, string[]> {
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

export function defaultDoubleOptInMetricValidator(): DoubleOptInMetricValidator {
  return new DoubleOptInMetricValidator(
    [
      new DoubleOptInMetricTitleLengthRule(86400),
      new DoubleOptInMetricRequiredTitleRule("double opt in metric needs this field"),
      new DoubleOptInMetricVisibleGuardRule(1.1),
      new DoubleOptInMetricCodePrefixRule("Q"),
      new DoubleOptInMetricCeilingRangeRule(1, 2377.9),
    ],
  );
}
