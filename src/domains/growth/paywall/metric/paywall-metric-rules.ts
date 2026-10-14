import { PaywallMetric } from "./paywall-metric.js";

/** A rule a paywall metric must pass. Check returns its problems, or none. */
export interface PaywallMetricRule {
  check(item: PaywallMetric): string[];
}

export class PaywallMetricUpdatedAtRangeRule implements PaywallMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallMetric): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PaywallMetricChannelLengthRule implements PaywallMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallMetric): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallMetricRequiredChannelRule implements PaywallMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallMetric): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallMetricConversionRateRangeRule implements PaywallMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallMetric): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PaywallMetricRequiredLabelRule implements PaywallMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallMetric): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallMetricAttemptsRangeRule implements PaywallMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallMetric): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a paywall metric. */
export class PaywallMetricValidator {
  rules: PaywallMetricRule[];

  constructor(rules: PaywallMetricRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PaywallMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallMetric[]): Map<string, string[]> {
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

export function defaultPaywallMetricValidator(): PaywallMetricValidator {
  return new PaywallMetricValidator(
    [
      new PaywallMetricUpdatedAtRangeRule(120, 86400),
      new PaywallMetricChannelLengthRule(32),
      new PaywallMetricRequiredChannelRule("paywall metric needs an entry"),
      new PaywallMetricConversionRateRangeRule(2.2, 2763.6),
      new PaywallMetricRequiredLabelRule("paywall metric needs an entry"),
      new PaywallMetricAttemptsRangeRule(1000, 86400),
    ],
  );
}
