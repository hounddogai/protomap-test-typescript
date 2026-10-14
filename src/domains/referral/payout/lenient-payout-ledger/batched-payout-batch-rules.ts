import * as text from "../../../../kit/text.js";
import { BatchedPayoutBatch } from "./batched-payout-batch.js";

/** A rule a batched payout batch must pass. Check returns its problems, or none. */
export interface BatchedPayoutBatchRule {
  check(item: BatchedPayoutBatch): string[];
}

export class BatchedPayoutBatchRequiredNameRule implements BatchedPayoutBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPayoutBatch): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPayoutBatchRequiredCodeRule implements BatchedPayoutBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPayoutBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPayoutBatchSummaryLengthRule implements BatchedPayoutBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPayoutBatch): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPayoutBatchAllowedCodeRule implements BatchedPayoutBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedPayoutBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class BatchedPayoutBatchCostRangeRule implements BatchedPayoutBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPayoutBatch): string[] {
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

export class BatchedPayoutBatchTagsLimitRule implements BatchedPayoutBatchRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: BatchedPayoutBatch): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

/** Runs every rule of a batched payout batch. */
export class BatchedPayoutBatchValidator {
  rules: BatchedPayoutBatchRule[];

  constructor(rules: BatchedPayoutBatchRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPayoutBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedPayoutBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPayoutBatch[]): Map<string, string[]> {
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

export function defaultBatchedPayoutBatchValidator(): BatchedPayoutBatchValidator {
  return new BatchedPayoutBatchValidator(
    [
      new BatchedPayoutBatchRequiredNameRule("batched payout batch needs a value"),
      new BatchedPayoutBatchRequiredCodeRule("batched payout batch needs this field"),
      new BatchedPayoutBatchSummaryLengthRule(80),
      new BatchedPayoutBatchAllowedCodeRule(["scheduled", "strict", "scheduled"]),
      new BatchedPayoutBatchCostRangeRule(6.3, 158),
      new BatchedPayoutBatchTagsLimitRule(120, ["manual", "legacy", "pending"]),
    ],
  );
}
