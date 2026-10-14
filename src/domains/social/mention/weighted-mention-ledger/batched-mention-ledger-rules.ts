import * as text from "../../../../kit/text.js";
import { BatchedMentionLedger } from "./batched-mention-ledger.js";

/** A rule a batched mention ledger must pass. Check returns its problems, or none. */
export interface BatchedMentionLedgerRule {
  check(item: BatchedMentionLedger): string[];
}

export class BatchedMentionLedgerCategoryLengthRule implements BatchedMentionLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedMentionLedger): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedMentionLedgerAllowedCategoryRule implements BatchedMentionLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedMentionLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is below minimum`];
    return [];
  }
}

export class BatchedMentionLedgerCapacityRangeRule implements BatchedMentionLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedMentionLedger): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedMentionLedgerTitleLengthRule implements BatchedMentionLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedMentionLedger): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedMentionLedgerRequiredCategoryRule implements BatchedMentionLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedMentionLedger): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedMentionLedgerCostRangeRule implements BatchedMentionLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedMentionLedger): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a batched mention ledger. */
export class BatchedMentionLedgerValidator {
  rules: BatchedMentionLedgerRule[];

  constructor(rules: BatchedMentionLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedMentionLedger): string[] {
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

  requireValid(item: BatchedMentionLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedMentionLedger[]): Map<string, string[]> {
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

export function defaultBatchedMentionLedgerValidator(): BatchedMentionLedgerValidator {
  return new BatchedMentionLedgerValidator(
    [
      new BatchedMentionLedgerCategoryLengthRule(3600),
      new BatchedMentionLedgerAllowedCategoryRule(["fallback", "batched"]),
      new BatchedMentionLedgerCapacityRangeRule(120, 86400),
      new BatchedMentionLedgerTitleLengthRule(32),
      new BatchedMentionLedgerRequiredCategoryRule("batched mention ledger needs a value"),
      new BatchedMentionLedgerCostRangeRule(1.3, 467.4),
    ],
  );
}
