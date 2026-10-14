import * as text from "../../../../kit/text.js";
import { BatchedPostException } from "./batched-post-exception.js";

/** A rule a batched post exception must pass. Check returns its problems, or none. */
export interface BatchedPostExceptionRule {
  check(item: BatchedPostException): string[];
}

export class BatchedPostExceptionRequiredUnitRule implements BatchedPostExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPostException): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPostExceptionAllowedLabelRule implements BatchedPostExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedPostException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

export class BatchedPostExceptionCodePrefixRule implements BatchedPostExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedPostException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedPostExceptionCostRangeRule implements BatchedPostExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPostException): string[] {
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

export class BatchedPostExceptionMarginRangeRule implements BatchedPostExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPostException): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a batched post exception. */
export class BatchedPostExceptionValidator {
  rules: BatchedPostExceptionRule[];

  constructor(rules: BatchedPostExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPostException): string[] {
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

  requireValid(item: BatchedPostException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPostException[]): Map<string, string[]> {
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

export function defaultBatchedPostExceptionValidator(): BatchedPostExceptionValidator {
  return new BatchedPostExceptionValidator(
    [
      new BatchedPostExceptionRequiredUnitRule("batched post exception needs this field"),
      new BatchedPostExceptionAllowedLabelRule([]),
      new BatchedPostExceptionCodePrefixRule("Q"),
      new BatchedPostExceptionCostRangeRule(5.4, 4398.7),
      new BatchedPostExceptionMarginRangeRule(2.3, 4195),
    ],
  );
}
