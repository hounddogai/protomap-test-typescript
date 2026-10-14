import * as text from "../../../../kit/text.js";
import { BatchedConversionCycle } from "./batched-conversion-cycle.js";

/** A rule a batched conversion cycle must pass. Check returns its problems, or none. */
export interface BatchedConversionCycleRule {
  check(item: BatchedConversionCycle): string[];
}

export class BatchedConversionCycleCohortLengthRule implements BatchedConversionCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedConversionCycle): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedConversionCycleLabelLengthRule implements BatchedConversionCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedConversionCycle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedConversionCycleAllowedLabelRule implements BatchedConversionCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedConversionCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is not allowed`];
    return [];
  }
}

export class BatchedConversionCycleRequiredContactEmailRule implements BatchedConversionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedConversionCycle): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched conversion cycle. */
export class BatchedConversionCycleValidator {
  rules: BatchedConversionCycleRule[];

  constructor(rules: BatchedConversionCycleRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedConversionCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedConversionCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedConversionCycle[]): Map<string, string[]> {
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

export function defaultBatchedConversionCycleValidator(): BatchedConversionCycleValidator {
  return new BatchedConversionCycleValidator(
    [
      new BatchedConversionCycleCohortLengthRule(120),
      new BatchedConversionCycleLabelLengthRule(3600),
      new BatchedConversionCycleAllowedLabelRule(["regional", "seasonal"]),
      new BatchedConversionCycleRequiredContactEmailRule("batched conversion cycle needs an entry"),
    ],
  );
}
