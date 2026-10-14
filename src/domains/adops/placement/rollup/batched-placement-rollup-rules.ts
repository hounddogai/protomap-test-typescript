import { BatchedPlacementRollup } from "./batched-placement-rollup.js";

/** A rule a batched placement rollup must pass. Check returns its problems, or none. */
export interface BatchedPlacementRollupRule {
  check(item: BatchedPlacementRollup): string[];
}

export class BatchedPlacementRollupRequiredLocaleRule implements BatchedPlacementRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPlacementRollup): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPlacementRollupRetriesRangeRule implements BatchedPlacementRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPlacementRollup): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedPlacementRollupCodeLengthRule implements BatchedPlacementRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPlacementRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPlacementRollupNameLengthRule implements BatchedPlacementRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPlacementRollup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched placement rollup. */
export class BatchedPlacementRollupValidator {
  rules: BatchedPlacementRollupRule[];

  constructor(rules: BatchedPlacementRollupRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPlacementRollup): string[] {
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

  requireValid(item: BatchedPlacementRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPlacementRollup[]): Map<string, string[]> {
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

export function defaultBatchedPlacementRollupValidator(): BatchedPlacementRollupValidator {
  return new BatchedPlacementRollupValidator(
    [
      new BatchedPlacementRollupRequiredLocaleRule("batched placement rollup needs this field"),
      new BatchedPlacementRollupRetriesRangeRule(64, 86400),
      new BatchedPlacementRollupCodeLengthRule(32),
      new BatchedPlacementRollupNameLengthRule(32),
    ],
  );
}
