import * as text from "../../../../kit/text.js";
import { BatchedActivationBatch } from "./batched-activation-batch.js";

/** A rule a batched activation batch must pass. Check returns its problems, or none. */
export interface BatchedActivationBatchRule {
  check(item: BatchedActivationBatch): string[];
}

export class BatchedActivationBatchTitleLengthRule implements BatchedActivationBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedActivationBatch): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedActivationBatchDiscountRangeRule implements BatchedActivationBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedActivationBatch): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedActivationBatchCategoryLengthRule implements BatchedActivationBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedActivationBatch): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedActivationBatchAllowedCountryRule implements BatchedActivationBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedActivationBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is unknown`];
    return [];
  }
}

export class BatchedActivationBatchRequiredCountryRule implements BatchedActivationBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedActivationBatch): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedActivationBatchUpdatedAtRangeRule implements BatchedActivationBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedActivationBatch): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a batched activation batch. */
export class BatchedActivationBatchValidator {
  rules: BatchedActivationBatchRule[];

  constructor(rules: BatchedActivationBatchRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedActivationBatch): string[] {
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

  requireValid(item: BatchedActivationBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedActivationBatch[]): Map<string, string[]> {
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

export function defaultBatchedActivationBatchValidator(): BatchedActivationBatchValidator {
  return new BatchedActivationBatchValidator(
    [
      new BatchedActivationBatchTitleLengthRule(120),
      new BatchedActivationBatchDiscountRangeRule(9.4, 2817.2),
      new BatchedActivationBatchCategoryLengthRule(80),
      new BatchedActivationBatchAllowedCountryRule(["tiered", "adaptive"]),
      new BatchedActivationBatchRequiredCountryRule("batched activation batch needs this field"),
      new BatchedActivationBatchUpdatedAtRangeRule(16, 32),
    ],
  );
}
