import * as text from "../../../../kit/text.js";
import { BatchedWaitPolicy } from "./batched-wait-policy.js";

/** A rule a batched wait policy must pass. Check returns its problems, or none. */
export interface BatchedWaitPolicyRule {
  check(item: BatchedWaitPolicy): string[];
}

export class BatchedWaitPolicyRequiredTitleRule implements BatchedWaitPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedWaitPolicy): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedWaitPolicyRequiredUtmSourceRule implements BatchedWaitPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedWaitPolicy): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedWaitPolicyRequiredCodeRule implements BatchedWaitPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedWaitPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedWaitPolicyCodeLengthRule implements BatchedWaitPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedWaitPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedWaitPolicyAllowedSummaryRule implements BatchedWaitPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedWaitPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is duplicated`];
    return [];
  }
}

export class BatchedWaitPolicyThresholdRangeRule implements BatchedWaitPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedWaitPolicy): string[] {
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

/** Runs every rule of a batched wait policy. */
export class BatchedWaitPolicyValidator {
  rules: BatchedWaitPolicyRule[];

  constructor(rules: BatchedWaitPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedWaitPolicy): string[] {
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

  requireValid(item: BatchedWaitPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedWaitPolicy[]): Map<string, string[]> {
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

export function defaultBatchedWaitPolicyValidator(): BatchedWaitPolicyValidator {
  return new BatchedWaitPolicyValidator(
    [
      new BatchedWaitPolicyRequiredTitleRule("batched wait policy needs a value"),
      new BatchedWaitPolicyRequiredUtmSourceRule("batched wait policy needs an entry"),
      new BatchedWaitPolicyRequiredCodeRule("batched wait policy needs an entry"),
      new BatchedWaitPolicyCodeLengthRule(120),
      new BatchedWaitPolicyAllowedSummaryRule(["default", "rolling", "rolling"]),
      new BatchedWaitPolicyThresholdRangeRule(4.7, 2252.2),
    ],
  );
}
