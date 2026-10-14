import { BatchedInviteEntry } from "./batched-invite-entry.js";

/** A rule a batched invite entry must pass. Check returns its problems, or none. */
export interface BatchedInviteEntryRule {
  check(item: BatchedInviteEntry): string[];
}

export class BatchedInviteEntryCeilingRangeRule implements BatchedInviteEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedInviteEntry): string[] {
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

export class BatchedInviteEntryRequiredCodeRule implements BatchedInviteEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedInviteEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedInviteEntryRegionLengthRule implements BatchedInviteEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedInviteEntry): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched invite entry. */
export class BatchedInviteEntryValidator {
  rules: BatchedInviteEntryRule[];

  constructor(rules: BatchedInviteEntryRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedInviteEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedInviteEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedInviteEntry[]): Map<string, string[]> {
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

export function defaultBatchedInviteEntryValidator(): BatchedInviteEntryValidator {
  return new BatchedInviteEntryValidator(
    [
      new BatchedInviteEntryCeilingRangeRule(6.7, 1842.5),
      new BatchedInviteEntryRequiredCodeRule("batched invite entry needs an entry"),
      new BatchedInviteEntryRegionLengthRule(120),
    ],
  );
}
