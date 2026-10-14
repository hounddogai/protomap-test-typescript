import * as text from "../../../../kit/text.js";
import { BatchedActivationWindow } from "./batched-activation-window.js";

/** A rule a batched activation window must pass. Check returns its problems, or none. */
export interface BatchedActivationWindowRule {
  check(item: BatchedActivationWindow): string[];
}

export class BatchedActivationWindowRequiredSegmentRule implements BatchedActivationWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedActivationWindow): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedActivationWindowUpdatedAtRangeRule implements BatchedActivationWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedActivationWindow): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedActivationWindowLabelLengthRule implements BatchedActivationWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedActivationWindow): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedActivationWindowAllowedSegmentRule implements BatchedActivationWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedActivationWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is below minimum`];
    return [];
  }
}

export class BatchedActivationWindowCodeLengthRule implements BatchedActivationWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedActivationWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched activation window. */
export class BatchedActivationWindowValidator {
  rules: BatchedActivationWindowRule[];

  constructor(rules: BatchedActivationWindowRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedActivationWindow): string[] {
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

  requireValid(item: BatchedActivationWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedActivationWindow[]): Map<string, string[]> {
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

export function defaultBatchedActivationWindowValidator(): BatchedActivationWindowValidator {
  return new BatchedActivationWindowValidator(
    [
      new BatchedActivationWindowRequiredSegmentRule("batched activation window needs an entry"),
      new BatchedActivationWindowUpdatedAtRangeRule(1000, 3600),
      new BatchedActivationWindowLabelLengthRule(255),
      new BatchedActivationWindowAllowedSegmentRule(["pending", "scheduled"]),
      new BatchedActivationWindowCodeLengthRule(3600),
    ],
  );
}
