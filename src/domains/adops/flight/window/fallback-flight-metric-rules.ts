import { FallbackFlightMetric } from "./fallback-flight-metric.js";

/** A rule a fallback flight metric must pass. Check returns its problems, or none. */
export interface FallbackFlightMetricRule {
  check(item: FallbackFlightMetric): string[];
}

export class FallbackFlightMetricCodePrefixRule implements FallbackFlightMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackFlightMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackFlightMetricTimezoneLengthRule implements FallbackFlightMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackFlightMetric): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackFlightMetricVersionRangeRule implements FallbackFlightMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackFlightMetric): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackFlightMetricVisibleGuardRule implements FallbackFlightMetricRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackFlightMetric): string[] {
    if (item.visible && item.impressions > this.limit) return [`impressions ${item.impressions} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a fallback flight metric. */
export class FallbackFlightMetricValidator {
  rules: FallbackFlightMetricRule[];

  constructor(rules: FallbackFlightMetricRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackFlightMetric): string[] {
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

  requireValid(item: FallbackFlightMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackFlightMetric[]): Map<string, string[]> {
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

export function defaultFallbackFlightMetricValidator(): FallbackFlightMetricValidator {
  return new FallbackFlightMetricValidator(
    [
      new FallbackFlightMetricCodePrefixRule("Q"),
      new FallbackFlightMetricTimezoneLengthRule(16),
      new FallbackFlightMetricVersionRangeRule(32, 32),
      new FallbackFlightMetricVisibleGuardRule(80),
    ],
  );
}
