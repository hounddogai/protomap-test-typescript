import * as text from "../../../../kit/text.js";
import { BatchedWarmupLedger } from "./batched-warmup-ledger.js";

/** A rule a batched warmup ledger must pass. Check returns its problems, or none. */
export interface BatchedWarmupLedgerRule {
  check(item: BatchedWarmupLedger): string[];
}

export class BatchedWarmupLedgerAllowedTitleRule implements BatchedWarmupLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedWarmupLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is blocked`];
    return [];
  }
}

export class BatchedWarmupLedgerCohortLengthRule implements BatchedWarmupLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedWarmupLedger): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedWarmupLedgerBatchSizeRangeRule implements BatchedWarmupLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedWarmupLedger): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedWarmupLedgerRequiredChecksumRule implements BatchedWarmupLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedWarmupLedger): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedWarmupLedgerThresholdRangeRule implements BatchedWarmupLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedWarmupLedger): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedWarmupLedgerChecksumLengthRule implements BatchedWarmupLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedWarmupLedger): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched warmup ledger. */
export class BatchedWarmupLedgerValidator {
  rules: BatchedWarmupLedgerRule[];

  constructor(rules: BatchedWarmupLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedWarmupLedger): string[] {
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

  requireValid(item: BatchedWarmupLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedWarmupLedger[]): Map<string, string[]> {
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

export function defaultBatchedWarmupLedgerValidator(): BatchedWarmupLedgerValidator {
  return new BatchedWarmupLedgerValidator(
    [
      new BatchedWarmupLedgerAllowedTitleRule([]),
      new BatchedWarmupLedgerCohortLengthRule(3600),
      new BatchedWarmupLedgerBatchSizeRangeRule(32, 120),
      new BatchedWarmupLedgerRequiredChecksumRule("batched warmup ledger needs a value"),
      new BatchedWarmupLedgerThresholdRangeRule(5.2, 4083.6),
      new BatchedWarmupLedgerChecksumLengthRule(86400),
    ],
  );
}
