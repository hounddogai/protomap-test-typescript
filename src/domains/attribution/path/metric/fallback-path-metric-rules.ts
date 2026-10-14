import { FallbackPathMetric } from "./fallback-path-metric.js";

/** A rule a fallback path metric must pass. Check returns its problems, or none. */
export interface FallbackPathMetricRule {
  check(item: FallbackPathMetric): string[];
}

export class FallbackPathMetricRequiredCodeRule implements FallbackPathMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPathMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackPathMetricAmountRangeRule implements FallbackPathMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPathMetric): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackPathMetricRequiredLabelRule implements FallbackPathMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPathMetric): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackPathMetricCodePrefixRule implements FallbackPathMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackPathMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackPathMetricBidRangeRule implements FallbackPathMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPathMetric): string[] {
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

export class FallbackPathMetricCodeLengthRule implements FallbackPathMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackPathMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback path metric. */
export class FallbackPathMetricValidator {
  rules: FallbackPathMetricRule[];

  constructor(rules: FallbackPathMetricRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackPathMetric): string[] {
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

  requireValid(item: FallbackPathMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackPathMetric[]): Map<string, string[]> {
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

export function defaultFallbackPathMetricValidator(): FallbackPathMetricValidator {
  return new FallbackPathMetricValidator(
    [
      new FallbackPathMetricRequiredCodeRule("fallback path metric needs this field"),
      new FallbackPathMetricAmountRangeRule(1.7, 1395.6),
      new FallbackPathMetricRequiredLabelRule("fallback path metric needs this field"),
      new FallbackPathMetricCodePrefixRule("REF"),
      new FallbackPathMetricBidRangeRule(6.4, 1970.7),
      new FallbackPathMetricCodeLengthRule(32),
    ],
  );
}
