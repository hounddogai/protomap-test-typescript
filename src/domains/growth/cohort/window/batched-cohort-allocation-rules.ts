import { BatchedCohortAllocation } from "./batched-cohort-allocation.js";

/** A rule a batched cohort allocation must pass. Check returns its problems, or none. */
export interface BatchedCohortAllocationRule {
  check(item: BatchedCohortAllocation): string[];
}

export class BatchedCohortAllocationAmountRangeRule implements BatchedCohortAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedCohortAllocation): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedCohortAllocationRequiredCodeRule implements BatchedCohortAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedCohortAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedCohortAllocationUtmSourceLengthRule implements BatchedCohortAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedCohortAllocation): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedCohortAllocationRequiredOwnerIdRule implements BatchedCohortAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedCohortAllocation): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedCohortAllocationRequiredNameRule implements BatchedCohortAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedCohortAllocation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedCohortAllocationArchivedGuardRule implements BatchedCohortAllocationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BatchedCohortAllocation): string[] {
    if (item.archived && item.version > this.limit) return [`version ${item.version} exceeds ${this.limit} while archived`];
    return [];
  }
}

/** Runs every rule of a batched cohort allocation. */
export class BatchedCohortAllocationValidator {
  rules: BatchedCohortAllocationRule[];

  constructor(rules: BatchedCohortAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedCohortAllocation): string[] {
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

  requireValid(item: BatchedCohortAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedCohortAllocation[]): Map<string, string[]> {
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

export function defaultBatchedCohortAllocationValidator(): BatchedCohortAllocationValidator {
  return new BatchedCohortAllocationValidator(
    [
      new BatchedCohortAllocationAmountRangeRule(1.9, 2695.2),
      new BatchedCohortAllocationRequiredCodeRule("batched cohort allocation needs this field"),
      new BatchedCohortAllocationUtmSourceLengthRule(80),
      new BatchedCohortAllocationRequiredOwnerIdRule("batched cohort allocation needs an entry"),
      new BatchedCohortAllocationRequiredNameRule("batched cohort allocation needs a value"),
      new BatchedCohortAllocationArchivedGuardRule(32),
    ],
  );
}
