import { SubscriptionMetric } from "./subscription-metric.js";

/** A rule a subscription metric must pass. Check returns its problems, or none. */
export interface SubscriptionMetricRule {
  check(item: SubscriptionMetric): string[];
}

export class SubscriptionMetricCodePrefixRule implements SubscriptionMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SubscriptionMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SubscriptionMetricVersionRangeRule implements SubscriptionMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionMetric): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionMetricRequiredExternalRefRule implements SubscriptionMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionMetric): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionMetricDurationMinutesRangeRule implements SubscriptionMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionMetric): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SubscriptionMetricCodeLengthRule implements SubscriptionMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a subscription metric. */
export class SubscriptionMetricValidator {
  rules: SubscriptionMetricRule[];

  constructor(rules: SubscriptionMetricRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionMetric[]): Map<string, string[]> {
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

export function defaultSubscriptionMetricValidator(): SubscriptionMetricValidator {
  return new SubscriptionMetricValidator(
    [
      new SubscriptionMetricCodePrefixRule("X"),
      new SubscriptionMetricVersionRangeRule(16, 80),
      new SubscriptionMetricRequiredExternalRefRule("subscription metric needs this field"),
      new SubscriptionMetricDurationMinutesRangeRule(80, 255),
      new SubscriptionMetricCodeLengthRule(255),
    ],
  );
}
