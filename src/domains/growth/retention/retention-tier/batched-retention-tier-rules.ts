import * as text from "../../../../kit/text.js";
import { BatchedRetentionTier } from "./batched-retention-tier.js";

/** A rule a batched retention tier must pass. Check returns its problems, or none. */
export interface BatchedRetentionTierRule {
  check(item: BatchedRetentionTier): string[];
}

export class BatchedRetentionTierCodePrefixRule implements BatchedRetentionTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedRetentionTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedRetentionTierSendAtRangeRule implements BatchedRetentionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedRetentionTier): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedRetentionTierAllowedLocaleRule implements BatchedRetentionTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedRetentionTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is unknown`];
    return [];
  }
}

export class BatchedRetentionTierBudgetRangeRule implements BatchedRetentionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedRetentionTier): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedRetentionTierArchivedGuardRule implements BatchedRetentionTierRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BatchedRetentionTier): string[] {
    if (item.archived && item.sendAt > this.limit) return [`send at ${item.sendAt} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class BatchedRetentionTierCodeLengthRule implements BatchedRetentionTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedRetentionTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched retention tier. */
export class BatchedRetentionTierValidator {
  rules: BatchedRetentionTierRule[];

  constructor(rules: BatchedRetentionTierRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedRetentionTier): string[] {
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

  requireValid(item: BatchedRetentionTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedRetentionTier[]): Map<string, string[]> {
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

export function defaultBatchedRetentionTierValidator(): BatchedRetentionTierValidator {
  return new BatchedRetentionTierValidator(
    [
      new BatchedRetentionTierCodePrefixRule("X"),
      new BatchedRetentionTierSendAtRangeRule(120, 3600),
      new BatchedRetentionTierAllowedLocaleRule(["tiered", "regional", "regional"]),
      new BatchedRetentionTierBudgetRangeRule(4, 3311),
      new BatchedRetentionTierArchivedGuardRule(120),
      new BatchedRetentionTierCodeLengthRule(1000),
    ],
  );
}
