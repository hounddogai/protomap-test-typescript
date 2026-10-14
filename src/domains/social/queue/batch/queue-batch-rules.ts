import * as text from "../../../../kit/text.js";
import { QueueBatch } from "./queue-batch.js";

/** A rule a queue batch must pass. Check returns its problems, or none. */
export interface QueueBatchRule {
  check(item: QueueBatch): string[];
}

export class QueueBatchRequiredCodeRule implements QueueBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class QueueBatchDiscountRangeRule implements QueueBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueBatch): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class QueueBatchAllowedCodeRule implements QueueBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: QueueBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

/** Runs every rule of a queue batch. */
export class QueueBatchValidator {
  rules: QueueBatchRule[];

  constructor(rules: QueueBatchRule[]) {
    this.rules = rules;
  }

  validate(item: QueueBatch): string[] {
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

  requireValid(item: QueueBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueBatch[]): Map<string, string[]> {
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

export function defaultQueueBatchValidator(): QueueBatchValidator {
  return new QueueBatchValidator(
    [
      new QueueBatchRequiredCodeRule("queue batch needs an entry"),
      new QueueBatchDiscountRangeRule(2.3, 2372.4),
      new QueueBatchAllowedCodeRule([]),
    ],
  );
}
