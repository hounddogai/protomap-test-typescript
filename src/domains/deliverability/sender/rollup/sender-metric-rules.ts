import * as text from "../../../../kit/text.js";
import { SenderMetric } from "./sender-metric.js";

/** A rule a sender metric must pass. Check returns its problems, or none. */
export interface SenderMetricRule {
  check(item: SenderMetric): string[];
}

export class SenderMetricBudgetRangeRule implements SenderMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderMetric): string[] {
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

export class SenderMetricAllowedTitleRule implements SenderMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SenderMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is expired`];
    return [];
  }
}

export class SenderMetricTitleLengthRule implements SenderMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderMetric): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderMetricThresholdRangeRule implements SenderMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderMetric): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a sender metric. */
export class SenderMetricValidator {
  rules: SenderMetricRule[];

  constructor(rules: SenderMetricRule[]) {
    this.rules = rules;
  }

  validate(item: SenderMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SenderMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderMetric[]): Map<string, string[]> {
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

export function defaultSenderMetricValidator(): SenderMetricValidator {
  return new SenderMetricValidator(
    [
      new SenderMetricBudgetRangeRule(2.4, 2868.2),
      new SenderMetricAllowedTitleRule(["tiered", "manual", "adaptive"]),
      new SenderMetricTitleLengthRule(255),
      new SenderMetricThresholdRangeRule(8.5, 4723.6),
    ],
  );
}
