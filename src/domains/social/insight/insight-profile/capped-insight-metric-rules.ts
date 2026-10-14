import * as text from "../../../../kit/text.js";
import { CappedInsightMetric } from "./capped-insight-metric.js";

/** A rule a capped insight metric must pass. Check returns its problems, or none. */
export interface CappedInsightMetricRule {
  check(item: CappedInsightMetric): string[];
}

export class CappedInsightMetricRequiredLabelRule implements CappedInsightMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedInsightMetric): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CappedInsightMetricAttemptsRangeRule implements CappedInsightMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedInsightMetric): string[] {
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

export class CappedInsightMetricSegmentLengthRule implements CappedInsightMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedInsightMetric): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedInsightMetricAllowedCodeRule implements CappedInsightMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedInsightMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

/** Runs every rule of a capped insight metric. */
export class CappedInsightMetricValidator {
  rules: CappedInsightMetricRule[];

  constructor(rules: CappedInsightMetricRule[]) {
    this.rules = rules;
  }

  validate(item: CappedInsightMetric): string[] {
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

  requireValid(item: CappedInsightMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedInsightMetric[]): Map<string, string[]> {
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

export function defaultCappedInsightMetricValidator(): CappedInsightMetricValidator {
  return new CappedInsightMetricValidator(
    [
      new CappedInsightMetricRequiredLabelRule("capped insight metric needs this field"),
      new CappedInsightMetricAttemptsRangeRule(120, 86400),
      new CappedInsightMetricSegmentLengthRule(80),
      new CappedInsightMetricAllowedCodeRule(["legacy", "regional"]),
    ],
  );
}
