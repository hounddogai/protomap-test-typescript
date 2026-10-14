import * as text from "../../../../kit/text.js";
import { BatchedTierRecord } from "./batched-tier-record.js";

/** A rule a batched tier record must pass. Check returns its problems, or none. */
export interface BatchedTierRecordRule {
  check(item: BatchedTierRecord): string[];
}

export class BatchedTierRecordRequiredLabelRule implements BatchedTierRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedTierRecord): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedTierRecordOpenRateRangeRule implements BatchedTierRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedTierRecord): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedTierRecordImpressionsRangeRule implements BatchedTierRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedTierRecord): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedTierRecordCodeLengthRule implements BatchedTierRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedTierRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedTierRecordEndsAtRangeRule implements BatchedTierRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedTierRecord): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedTierRecordAllowedChecksumRule implements BatchedTierRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedTierRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is stale`];
    return [];
  }
}

/** Runs every rule of a batched tier record. */
export class BatchedTierRecordValidator {
  rules: BatchedTierRecordRule[];

  constructor(rules: BatchedTierRecordRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedTierRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedTierRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedTierRecord[]): Map<string, string[]> {
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

export function defaultBatchedTierRecordValidator(): BatchedTierRecordValidator {
  return new BatchedTierRecordValidator(
    [
      new BatchedTierRecordRequiredLabelRule("batched tier record needs an entry"),
      new BatchedTierRecordOpenRateRangeRule(3, 4621.9),
      new BatchedTierRecordImpressionsRangeRule(32, 120),
      new BatchedTierRecordCodeLengthRule(80),
      new BatchedTierRecordEndsAtRangeRule(16, 64),
      new BatchedTierRecordAllowedChecksumRule([]),
    ],
  );
}
