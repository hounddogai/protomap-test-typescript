import { TieredActivationMetric } from "./tiered-activation-metric.js";

/** A rule a tiered activation metric must pass. Check returns its problems, or none. */
export interface TieredActivationMetricRule {
  check(item: TieredActivationMetric): string[];
}

export class TieredActivationMetricRequiredJourneyIdRule implements TieredActivationMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredActivationMetric): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class TieredActivationMetricCostRangeRule implements TieredActivationMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredActivationMetric): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredActivationMetricJourneyIdLengthRule implements TieredActivationMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredActivationMetric): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredActivationMetricLimitRangeRule implements TieredActivationMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredActivationMetric): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredActivationMetricRequiredLabelRule implements TieredActivationMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredActivationMetric): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredActivationMetricClicksRangeRule implements TieredActivationMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredActivationMetric): string[] {
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

/** Runs every rule of a tiered activation metric. */
export class TieredActivationMetricValidator {
  rules: TieredActivationMetricRule[];

  constructor(rules: TieredActivationMetricRule[]) {
    this.rules = rules;
  }

  validate(item: TieredActivationMetric): string[] {
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

  requireValid(item: TieredActivationMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredActivationMetric[]): Map<string, string[]> {
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

export function defaultTieredActivationMetricValidator(): TieredActivationMetricValidator {
  return new TieredActivationMetricValidator(
    [
      new TieredActivationMetricRequiredJourneyIdRule("tiered activation metric needs a value"),
      new TieredActivationMetricCostRangeRule(0.8, 3403.2),
      new TieredActivationMetricJourneyIdLengthRule(80),
      new TieredActivationMetricLimitRangeRule(80, 120),
      new TieredActivationMetricRequiredLabelRule("tiered activation metric needs a value"),
      new TieredActivationMetricClicksRangeRule(1000, 1000),
    ],
  );
}
