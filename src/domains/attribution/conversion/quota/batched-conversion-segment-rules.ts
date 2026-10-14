import * as text from "../../../../kit/text.js";
import { BatchedConversionSegment } from "./batched-conversion-segment.js";

/** A rule a batched conversion segment must pass. Check returns its problems, or none. */
export interface BatchedConversionSegmentRule {
  check(item: BatchedConversionSegment): string[];
}

export class BatchedConversionSegmentCodePrefixRule implements BatchedConversionSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedConversionSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedConversionSegmentAllowedCodeRule implements BatchedConversionSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedConversionSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class BatchedConversionSegmentRequiredCodeRule implements BatchedConversionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedConversionSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedConversionSegmentRequiredLabelRule implements BatchedConversionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedConversionSegment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedConversionSegmentLabelLengthRule implements BatchedConversionSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedConversionSegment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedConversionSegmentRateRangeRule implements BatchedConversionSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedConversionSegment): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a batched conversion segment. */
export class BatchedConversionSegmentValidator {
  rules: BatchedConversionSegmentRule[];

  constructor(rules: BatchedConversionSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedConversionSegment): string[] {
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

  requireValid(item: BatchedConversionSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedConversionSegment[]): Map<string, string[]> {
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

export function defaultBatchedConversionSegmentValidator(): BatchedConversionSegmentValidator {
  return new BatchedConversionSegmentValidator(
    [
      new BatchedConversionSegmentCodePrefixRule("ACM"),
      new BatchedConversionSegmentAllowedCodeRule([]),
      new BatchedConversionSegmentRequiredCodeRule("batched conversion segment needs a value"),
      new BatchedConversionSegmentRequiredLabelRule("batched conversion segment needs a value"),
      new BatchedConversionSegmentLabelLengthRule(255),
      new BatchedConversionSegmentRateRangeRule(2.8, 2612.2),
    ],
  );
}
