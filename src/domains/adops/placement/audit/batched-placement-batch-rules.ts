import { BatchedPlacementBatch } from "./batched-placement-batch.js";

/** A rule a batched placement batch must pass. Check returns its problems, or none. */
export interface BatchedPlacementBatchRule {
  check(item: BatchedPlacementBatch): string[];
}

export class BatchedPlacementBatchCodePrefixRule implements BatchedPlacementBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedPlacementBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedPlacementBatchTitleLengthRule implements BatchedPlacementBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPlacementBatch): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPlacementBatchFrequencyCapRangeRule implements BatchedPlacementBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPlacementBatch): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedPlacementBatchOwnerIdLengthRule implements BatchedPlacementBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPlacementBatch): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPlacementBatchAmountRangeRule implements BatchedPlacementBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPlacementBatch): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a batched placement batch. */
export class BatchedPlacementBatchValidator {
  rules: BatchedPlacementBatchRule[];

  constructor(rules: BatchedPlacementBatchRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPlacementBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedPlacementBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPlacementBatch[]): Map<string, string[]> {
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

export function defaultBatchedPlacementBatchValidator(): BatchedPlacementBatchValidator {
  return new BatchedPlacementBatchValidator(
    [
      new BatchedPlacementBatchCodePrefixRule("OPS"),
      new BatchedPlacementBatchTitleLengthRule(64),
      new BatchedPlacementBatchFrequencyCapRangeRule(80, 255),
      new BatchedPlacementBatchOwnerIdLengthRule(32),
      new BatchedPlacementBatchAmountRangeRule(2.6, 4909.2),
    ],
  );
}
