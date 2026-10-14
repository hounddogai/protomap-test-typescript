import { PayoutMetric } from "./payout-metric.js";

/** A rule a payout metric must pass. Check returns its problems, or none. */
export interface PayoutMetricRule {
  check(item: PayoutMetric): string[];
}

export class PayoutMetricNameLengthRule implements PayoutMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutMetric): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutMetricChannelLengthRule implements PayoutMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutMetric): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutMetricApprovedGuardRule implements PayoutMetricRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PayoutMetric): string[] {
    if (item.approved && item.clicks > this.limit) return [`clicks ${item.clicks} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class PayoutMetricClicksRangeRule implements PayoutMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutMetric): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a payout metric. */
export class PayoutMetricValidator {
  rules: PayoutMetricRule[];

  constructor(rules: PayoutMetricRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutMetric): string[] {
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

  requireValid(item: PayoutMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutMetric[]): Map<string, string[]> {
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

export function defaultPayoutMetricValidator(): PayoutMetricValidator {
  return new PayoutMetricValidator(
    [
      new PayoutMetricNameLengthRule(255),
      new PayoutMetricChannelLengthRule(86400),
      new PayoutMetricApprovedGuardRule(3600),
      new PayoutMetricClicksRangeRule(64, 120),
    ],
  );
}
