import { SeasonalSubscriptionMetric } from "./seasonal-subscription-metric.js";

/** A rule a seasonal subscription metric must pass. Check returns its problems, or none. */
export interface SeasonalSubscriptionMetricRule {
  check(item: SeasonalSubscriptionMetric): string[];
}

export class SeasonalSubscriptionMetricBudgetRangeRule implements SeasonalSubscriptionMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalSubscriptionMetric): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalSubscriptionMetricFloorValueRangeRule implements SeasonalSubscriptionMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalSubscriptionMetric): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalSubscriptionMetricTimezoneLengthRule implements SeasonalSubscriptionMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalSubscriptionMetric): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalSubscriptionMetricRequiredLocaleRule implements SeasonalSubscriptionMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalSubscriptionMetric): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalSubscriptionMetricNameLengthRule implements SeasonalSubscriptionMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalSubscriptionMetric): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalSubscriptionMetricRequiredTimezoneRule implements SeasonalSubscriptionMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalSubscriptionMetric): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal subscription metric. */
export class SeasonalSubscriptionMetricValidator {
  rules: SeasonalSubscriptionMetricRule[];

  constructor(rules: SeasonalSubscriptionMetricRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalSubscriptionMetric): string[] {
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

  requireValid(item: SeasonalSubscriptionMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalSubscriptionMetric[]): Map<string, string[]> {
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

export function defaultSeasonalSubscriptionMetricValidator(): SeasonalSubscriptionMetricValidator {
  return new SeasonalSubscriptionMetricValidator(
    [
      new SeasonalSubscriptionMetricBudgetRangeRule(6, 925.6),
      new SeasonalSubscriptionMetricFloorValueRangeRule(3.7, 3108.9),
      new SeasonalSubscriptionMetricTimezoneLengthRule(3600),
      new SeasonalSubscriptionMetricRequiredLocaleRule("seasonal subscription metric needs an entry"),
      new SeasonalSubscriptionMetricNameLengthRule(64),
      new SeasonalSubscriptionMetricRequiredTimezoneRule("seasonal subscription metric needs an entry"),
    ],
  );
}
