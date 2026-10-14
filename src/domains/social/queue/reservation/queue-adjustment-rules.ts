import * as text from "../../../../kit/text.js";
import { QueueAdjustment } from "./queue-adjustment.js";

/** A rule a queue adjustment must pass. Check returns its problems, or none. */
export interface QueueAdjustmentRule {
  check(item: QueueAdjustment): string[];
}

export class QueueAdjustmentAllowedCodeRule implements QueueAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: QueueAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class QueueAdjustmentRequiredCodeRule implements QueueAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class QueueAdjustmentLocaleLengthRule implements QueueAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueAdjustment): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a queue adjustment. */
export class QueueAdjustmentValidator {
  rules: QueueAdjustmentRule[];

  constructor(rules: QueueAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: QueueAdjustment): string[] {
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

  requireValid(item: QueueAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueAdjustment[]): Map<string, string[]> {
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

export function defaultQueueAdjustmentValidator(): QueueAdjustmentValidator {
  return new QueueAdjustmentValidator(
    [
      new QueueAdjustmentAllowedCodeRule(["pending", "scheduled", "weighted"]),
      new QueueAdjustmentRequiredCodeRule("queue adjustment needs this field"),
      new QueueAdjustmentLocaleLengthRule(255),
    ],
  );
}
