import * as text from "../../../../kit/text.js";
import { BatchedWarmupBatch } from "./batched-warmup-batch.js";

/** A rule a batched warmup batch must pass. Check returns its problems, or none. */
export interface BatchedWarmupBatchRule {
  check(item: BatchedWarmupBatch): string[];
}

export class BatchedWarmupBatchCodePrefixRule implements BatchedWarmupBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedWarmupBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedWarmupBatchRequiredCategoryRule implements BatchedWarmupBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedWarmupBatch): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedWarmupBatchAllowedTimezoneRule implements BatchedWarmupBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedWarmupBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is below minimum`];
    return [];
  }
}

export class BatchedWarmupBatchExpiresAtRangeRule implements BatchedWarmupBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedWarmupBatch): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a batched warmup batch. */
export class BatchedWarmupBatchValidator {
  rules: BatchedWarmupBatchRule[];

  constructor(rules: BatchedWarmupBatchRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedWarmupBatch): string[] {
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

  requireValid(item: BatchedWarmupBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedWarmupBatch[]): Map<string, string[]> {
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

export function defaultBatchedWarmupBatchValidator(): BatchedWarmupBatchValidator {
  return new BatchedWarmupBatchValidator(
    [
      new BatchedWarmupBatchCodePrefixRule("X"),
      new BatchedWarmupBatchRequiredCategoryRule("batched warmup batch needs a value"),
      new BatchedWarmupBatchAllowedTimezoneRule(["legacy", "lenient", "strict"]),
      new BatchedWarmupBatchExpiresAtRangeRule(64, 64),
    ],
  );
}
