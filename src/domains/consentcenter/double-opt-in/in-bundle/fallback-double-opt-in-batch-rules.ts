import * as text from "../../../../kit/text.js";
import { FallbackDoubleOptInBatch } from "./fallback-double-opt-in-batch.js";

/** A rule a fallback double opt in batch must pass. Check returns its problems, or none. */
export interface FallbackDoubleOptInBatchRule {
  check(item: FallbackDoubleOptInBatch): string[];
}

export class FallbackDoubleOptInBatchTitleLengthRule implements FallbackDoubleOptInBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackDoubleOptInBatch): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackDoubleOptInBatchCodeLengthRule implements FallbackDoubleOptInBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackDoubleOptInBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackDoubleOptInBatchCostRangeRule implements FallbackDoubleOptInBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackDoubleOptInBatch): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackDoubleOptInBatchAllowedTitleRule implements FallbackDoubleOptInBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackDoubleOptInBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is blocked`];
    return [];
  }
}

export class FallbackDoubleOptInBatchRequiredReviewerRule implements FallbackDoubleOptInBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackDoubleOptInBatch): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackDoubleOptInBatchPhoneLengthRule implements FallbackDoubleOptInBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackDoubleOptInBatch): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback double opt in batch. */
export class FallbackDoubleOptInBatchValidator {
  rules: FallbackDoubleOptInBatchRule[];

  constructor(rules: FallbackDoubleOptInBatchRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackDoubleOptInBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackDoubleOptInBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackDoubleOptInBatch[]): Map<string, string[]> {
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

export function defaultFallbackDoubleOptInBatchValidator(): FallbackDoubleOptInBatchValidator {
  return new FallbackDoubleOptInBatchValidator(
    [
      new FallbackDoubleOptInBatchTitleLengthRule(86400),
      new FallbackDoubleOptInBatchCodeLengthRule(1000),
      new FallbackDoubleOptInBatchCostRangeRule(1, 4033.1),
      new FallbackDoubleOptInBatchAllowedTitleRule(["manual"]),
      new FallbackDoubleOptInBatchRequiredReviewerRule("fallback double opt in batch needs a value"),
      new FallbackDoubleOptInBatchPhoneLengthRule(80),
    ],
  );
}
