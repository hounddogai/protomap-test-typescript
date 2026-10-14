import * as text from "../../../../kit/text.js";
import { BatchedStepAdjustment } from "./batched-step-adjustment.js";

/** A rule a batched step adjustment must pass. Check returns its problems, or none. */
export interface BatchedStepAdjustmentRule {
  check(item: BatchedStepAdjustment): string[];
}

export class BatchedStepAdjustmentSegmentLengthRule implements BatchedStepAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedStepAdjustment): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedStepAdjustmentNameLengthRule implements BatchedStepAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedStepAdjustment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedStepAdjustmentWeightRangeRule implements BatchedStepAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedStepAdjustment): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedStepAdjustmentAllowedExternalRefRule implements BatchedStepAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedStepAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is not allowed`];
    return [];
  }
}

/** Runs every rule of a batched step adjustment. */
export class BatchedStepAdjustmentValidator {
  rules: BatchedStepAdjustmentRule[];

  constructor(rules: BatchedStepAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedStepAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedStepAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedStepAdjustment[]): Map<string, string[]> {
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

export function defaultBatchedStepAdjustmentValidator(): BatchedStepAdjustmentValidator {
  return new BatchedStepAdjustmentValidator(
    [
      new BatchedStepAdjustmentSegmentLengthRule(255),
      new BatchedStepAdjustmentNameLengthRule(64),
      new BatchedStepAdjustmentWeightRangeRule(1.2, 1855.5),
      new BatchedStepAdjustmentAllowedExternalRefRule([]),
    ],
  );
}
