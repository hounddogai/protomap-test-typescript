import * as text from "../../../../kit/text.js";
import { BatchedCsatMetric } from "./batched-csat-metric.js";

/** A rule a batched csat metric must pass. Check returns its problems, or none. */
export interface BatchedCsatMetricRule {
  check(item: BatchedCsatMetric): string[];
}

export class BatchedCsatMetricRequiredTitleRule implements BatchedCsatMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedCsatMetric): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedCsatMetricRequiredCurrencyRule implements BatchedCsatMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedCsatMetric): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedCsatMetricCodePrefixRule implements BatchedCsatMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedCsatMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedCsatMetricAllowedTitleRule implements BatchedCsatMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedCsatMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is stale`];
    return [];
  }
}

export class BatchedCsatMetricCountryLengthRule implements BatchedCsatMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedCsatMetric): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched csat metric. */
export class BatchedCsatMetricValidator {
  rules: BatchedCsatMetricRule[];

  constructor(rules: BatchedCsatMetricRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedCsatMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedCsatMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedCsatMetric[]): Map<string, string[]> {
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

export function defaultBatchedCsatMetricValidator(): BatchedCsatMetricValidator {
  return new BatchedCsatMetricValidator(
    [
      new BatchedCsatMetricRequiredTitleRule("batched csat metric needs a value"),
      new BatchedCsatMetricRequiredCurrencyRule("batched csat metric needs this field"),
      new BatchedCsatMetricCodePrefixRule("ACM"),
      new BatchedCsatMetricAllowedTitleRule(["adaptive", "scheduled"]),
      new BatchedCsatMetricCountryLengthRule(3600),
    ],
  );
}
