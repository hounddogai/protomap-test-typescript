import * as text from "../../../../kit/text.js";
import { BatchedSenderBatch } from "./batched-sender-batch.js";

/** A rule a batched sender batch must pass. Check returns its problems, or none. */
export interface BatchedSenderBatchRule {
  check(item: BatchedSenderBatch): string[];
}

export class BatchedSenderBatchRequiredLabelRule implements BatchedSenderBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedSenderBatch): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedSenderBatchAllowedNameRule implements BatchedSenderBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedSenderBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is stale`];
    return [];
  }
}

export class BatchedSenderBatchCodePrefixRule implements BatchedSenderBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedSenderBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedSenderBatchCeilingRangeRule implements BatchedSenderBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedSenderBatch): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedSenderBatchNameLengthRule implements BatchedSenderBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedSenderBatch): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched sender batch. */
export class BatchedSenderBatchValidator {
  rules: BatchedSenderBatchRule[];

  constructor(rules: BatchedSenderBatchRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedSenderBatch): string[] {
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

  requireValid(item: BatchedSenderBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedSenderBatch[]): Map<string, string[]> {
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

export function defaultBatchedSenderBatchValidator(): BatchedSenderBatchValidator {
  return new BatchedSenderBatchValidator(
    [
      new BatchedSenderBatchRequiredLabelRule("batched sender batch needs a value"),
      new BatchedSenderBatchAllowedNameRule(["batched", "lenient", "rolling"]),
      new BatchedSenderBatchCodePrefixRule("X"),
      new BatchedSenderBatchCeilingRangeRule(2.9, 3430.7),
      new BatchedSenderBatchNameLengthRule(1000),
    ],
  );
}
