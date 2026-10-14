import * as text from "../../../../kit/text.js";
import { TieredDomainMetric } from "./tiered-domain-metric.js";

/** A rule a tiered domain metric must pass. Check returns its problems, or none. */
export interface TieredDomainMetricRule {
  check(item: TieredDomainMetric): string[];
}

export class TieredDomainMetricAllowedLabelRule implements TieredDomainMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredDomainMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is inconsistent`];
    return [];
  }
}

export class TieredDomainMetricCostRangeRule implements TieredDomainMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredDomainMetric): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredDomainMetricLabelLengthRule implements TieredDomainMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredDomainMetric): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredDomainMetricBudgetRangeRule implements TieredDomainMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredDomainMetric): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered domain metric. */
export class TieredDomainMetricValidator {
  rules: TieredDomainMetricRule[];

  constructor(rules: TieredDomainMetricRule[]) {
    this.rules = rules;
  }

  validate(item: TieredDomainMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredDomainMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredDomainMetric[]): Map<string, string[]> {
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

export function defaultTieredDomainMetricValidator(): TieredDomainMetricValidator {
  return new TieredDomainMetricValidator(
    [
      new TieredDomainMetricAllowedLabelRule(["default", "scheduled", "batched"]),
      new TieredDomainMetricCostRangeRule(3.5, 4747.8),
      new TieredDomainMetricLabelLengthRule(16),
      new TieredDomainMetricBudgetRangeRule(9.3, 4413.9),
    ],
  );
}
