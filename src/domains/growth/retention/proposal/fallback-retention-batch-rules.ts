import * as text from "../../../../kit/text.js";
import { FallbackRetentionBatch } from "./fallback-retention-batch.js";

/** A rule a fallback retention batch must pass. Check returns its problems, or none. */
export interface FallbackRetentionBatchRule {
  check(item: FallbackRetentionBatch): string[];
}

export class FallbackRetentionBatchLabelLengthRule implements FallbackRetentionBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackRetentionBatch): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackRetentionBatchCodeLengthRule implements FallbackRetentionBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackRetentionBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackRetentionBatchRateRangeRule implements FallbackRetentionBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackRetentionBatch): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackRetentionBatchRequiredLabelRule implements FallbackRetentionBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackRetentionBatch): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackRetentionBatchRequiredSegmentRule implements FallbackRetentionBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackRetentionBatch): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackRetentionBatchAllowedSegmentRule implements FallbackRetentionBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackRetentionBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is missing`];
    return [];
  }
}

/** Runs every rule of a fallback retention batch. */
export class FallbackRetentionBatchValidator {
  rules: FallbackRetentionBatchRule[];

  constructor(rules: FallbackRetentionBatchRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackRetentionBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackRetentionBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackRetentionBatch[]): Map<string, string[]> {
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

export function defaultFallbackRetentionBatchValidator(): FallbackRetentionBatchValidator {
  return new FallbackRetentionBatchValidator(
    [
      new FallbackRetentionBatchLabelLengthRule(16),
      new FallbackRetentionBatchCodeLengthRule(32),
      new FallbackRetentionBatchRateRangeRule(6, 2808.8),
      new FallbackRetentionBatchRequiredLabelRule("fallback retention batch needs an entry"),
      new FallbackRetentionBatchRequiredSegmentRule("fallback retention batch needs a value"),
      new FallbackRetentionBatchAllowedSegmentRule(["capped", "manual"]),
    ],
  );
}
