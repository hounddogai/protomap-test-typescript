import * as text from "../../../../kit/text.js";
import { BatchedPathProfile } from "./batched-path-profile.js";

/** A rule a batched path profile must pass. Check returns its problems, or none. */
export interface BatchedPathProfileRule {
  check(item: BatchedPathProfile): string[];
}

export class BatchedPathProfileLabelLengthRule implements BatchedPathProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPathProfile): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPathProfileActiveGuardRule implements BatchedPathProfileRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BatchedPathProfile): string[] {
    if (item.active && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while active`];
    return [];
  }
}

export class BatchedPathProfileRequiredCodeRule implements BatchedPathProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPathProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPathProfileAllowedOwnerIdRule implements BatchedPathProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedPathProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is above maximum`];
    return [];
  }
}

export class BatchedPathProfileRequiredTimezoneRule implements BatchedPathProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPathProfile): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPathProfileBudgetRangeRule implements BatchedPathProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPathProfile): string[] {
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

/** Runs every rule of a batched path profile. */
export class BatchedPathProfileValidator {
  rules: BatchedPathProfileRule[];

  constructor(rules: BatchedPathProfileRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPathProfile): string[] {
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

  requireValid(item: BatchedPathProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPathProfile[]): Map<string, string[]> {
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

export function defaultBatchedPathProfileValidator(): BatchedPathProfileValidator {
  return new BatchedPathProfileValidator(
    [
      new BatchedPathProfileLabelLengthRule(1000),
      new BatchedPathProfileActiveGuardRule(6.2),
      new BatchedPathProfileRequiredCodeRule("batched path profile needs this field"),
      new BatchedPathProfileAllowedOwnerIdRule(["pending", "fallback", "scheduled"]),
      new BatchedPathProfileRequiredTimezoneRule("batched path profile needs a value"),
      new BatchedPathProfileBudgetRangeRule(4.9, 2052.9),
    ],
  );
}
