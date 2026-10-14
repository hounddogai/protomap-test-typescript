import * as text from "../../../../kit/text.js";
import { ManualReplyMetric } from "./manual-reply-metric.js";

/** A rule a manual reply metric must pass. Check returns its problems, or none. */
export interface ManualReplyMetricRule {
  check(item: ManualReplyMetric): string[];
}

export class ManualReplyMetricAllowedLabelRule implements ManualReplyMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualReplyMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is missing`];
    return [];
  }
}

export class ManualReplyMetricBatchSizeRangeRule implements ManualReplyMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualReplyMetric): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualReplyMetricRequiredCodeRule implements ManualReplyMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualReplyMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualReplyMetricCodeLengthRule implements ManualReplyMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualReplyMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualReplyMetricContactEmailLengthRule implements ManualReplyMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualReplyMetric): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualReplyMetricClicksRangeRule implements ManualReplyMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualReplyMetric): string[] {
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

/** Runs every rule of a manual reply metric. */
export class ManualReplyMetricValidator {
  rules: ManualReplyMetricRule[];

  constructor(rules: ManualReplyMetricRule[]) {
    this.rules = rules;
  }

  validate(item: ManualReplyMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualReplyMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualReplyMetric[]): Map<string, string[]> {
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

export function defaultManualReplyMetricValidator(): ManualReplyMetricValidator {
  return new ManualReplyMetricValidator(
    [
      new ManualReplyMetricAllowedLabelRule(["batched", "default"]),
      new ManualReplyMetricBatchSizeRangeRule(64, 255),
      new ManualReplyMetricRequiredCodeRule("manual reply metric needs this field"),
      new ManualReplyMetricCodeLengthRule(120),
      new ManualReplyMetricContactEmailLengthRule(3600),
      new ManualReplyMetricClicksRangeRule(1000, 1000),
    ],
  );
}
