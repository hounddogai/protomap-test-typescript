import { RetentionMetric } from "./retention-metric.js";

/** A rule a retention metric must pass. Check returns its problems, or none. */
export interface RetentionMetricRule {
  check(item: RetentionMetric): string[];
}

export class RetentionMetricRevisionRangeRule implements RetentionMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionMetric): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionMetricOpenRateRangeRule implements RetentionMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionMetric): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionMetricRequiredPhoneRule implements RetentionMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionMetric): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionMetricWeightRangeRule implements RetentionMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionMetric): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionMetricNameLengthRule implements RetentionMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionMetric): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a retention metric. */
export class RetentionMetricValidator {
  rules: RetentionMetricRule[];

  constructor(rules: RetentionMetricRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionMetric): string[] {
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

  requireValid(item: RetentionMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionMetric[]): Map<string, string[]> {
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

export function defaultRetentionMetricValidator(): RetentionMetricValidator {
  return new RetentionMetricValidator(
    [
      new RetentionMetricRevisionRangeRule(80, 1000),
      new RetentionMetricOpenRateRangeRule(9.7, 4905.8),
      new RetentionMetricRequiredPhoneRule("retention metric needs a value"),
      new RetentionMetricWeightRangeRule(7.1, 4630.8),
      new RetentionMetricNameLengthRule(32),
    ],
  );
}
