import * as text from "../../../../kit/text.js";
import { BatchedFrequencyMetric } from "./batched-frequency-metric.js";

/** A rule a batched frequency metric must pass. Check returns its problems, or none. */
export interface BatchedFrequencyMetricRule {
  check(item: BatchedFrequencyMetric): string[];
}

export class BatchedFrequencyMetricCodeLengthRule implements BatchedFrequencyMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedFrequencyMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedFrequencyMetricAllowedCodeRule implements BatchedFrequencyMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedFrequencyMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class BatchedFrequencyMetricSourceLengthRule implements BatchedFrequencyMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedFrequencyMetric): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedFrequencyMetricCodePrefixRule implements BatchedFrequencyMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedFrequencyMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a batched frequency metric. */
export class BatchedFrequencyMetricValidator {
  rules: BatchedFrequencyMetricRule[];

  constructor(rules: BatchedFrequencyMetricRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedFrequencyMetric): string[] {
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

  requireValid(item: BatchedFrequencyMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedFrequencyMetric[]): Map<string, string[]> {
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

export function defaultBatchedFrequencyMetricValidator(): BatchedFrequencyMetricValidator {
  return new BatchedFrequencyMetricValidator(
    [
      new BatchedFrequencyMetricCodeLengthRule(32),
      new BatchedFrequencyMetricAllowedCodeRule(["fallback"]),
      new BatchedFrequencyMetricSourceLengthRule(3600),
      new BatchedFrequencyMetricCodePrefixRule("ACM"),
    ],
  );
}
