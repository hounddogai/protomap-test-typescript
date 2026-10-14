import * as text from "../../../../kit/text.js";
import { BatchedPostWindow } from "./batched-post-window.js";

/** A rule a batched post window must pass. Check returns its problems, or none. */
export interface BatchedPostWindowRule {
  check(item: BatchedPostWindow): string[];
}

export class BatchedPostWindowLabelLengthRule implements BatchedPostWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPostWindow): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPostWindowMinimumRangeRule implements BatchedPostWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPostWindow): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedPostWindowAllowedCodeRule implements BatchedPostWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedPostWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class BatchedPostWindowCapacityRangeRule implements BatchedPostWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPostWindow): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedPostWindowCodePrefixRule implements BatchedPostWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedPostWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a batched post window. */
export class BatchedPostWindowValidator {
  rules: BatchedPostWindowRule[];

  constructor(rules: BatchedPostWindowRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPostWindow): string[] {
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

  requireValid(item: BatchedPostWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPostWindow[]): Map<string, string[]> {
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

export function defaultBatchedPostWindowValidator(): BatchedPostWindowValidator {
  return new BatchedPostWindowValidator(
    [
      new BatchedPostWindowLabelLengthRule(80),
      new BatchedPostWindowMinimumRangeRule(5.6, 1075.1),
      new BatchedPostWindowAllowedCodeRule(["legacy", "default"]),
      new BatchedPostWindowCapacityRangeRule(255, 86400),
      new BatchedPostWindowCodePrefixRule("X"),
    ],
  );
}
