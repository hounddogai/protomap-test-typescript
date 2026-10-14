import * as text from "../../../../kit/text.js";
import { BatchedCreditEntry } from "./batched-credit-entry.js";

/** A rule a batched credit entry must pass. Check returns its problems, or none. */
export interface BatchedCreditEntryRule {
  check(item: BatchedCreditEntry): string[];
}

export class BatchedCreditEntryWeightRangeRule implements BatchedCreditEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedCreditEntry): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedCreditEntryRequiredLabelRule implements BatchedCreditEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedCreditEntry): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedCreditEntryAllowedLabelRule implements BatchedCreditEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedCreditEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is above maximum`];
    return [];
  }
}

export class BatchedCreditEntryNameLengthRule implements BatchedCreditEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedCreditEntry): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched credit entry. */
export class BatchedCreditEntryValidator {
  rules: BatchedCreditEntryRule[];

  constructor(rules: BatchedCreditEntryRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedCreditEntry): string[] {
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

  requireValid(item: BatchedCreditEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedCreditEntry[]): Map<string, string[]> {
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

export function defaultBatchedCreditEntryValidator(): BatchedCreditEntryValidator {
  return new BatchedCreditEntryValidator(
    [
      new BatchedCreditEntryWeightRangeRule(10, 4164.3),
      new BatchedCreditEntryRequiredLabelRule("batched credit entry needs an entry"),
      new BatchedCreditEntryAllowedLabelRule([]),
      new BatchedCreditEntryNameLengthRule(64),
    ],
  );
}
