import { TieredApprovalBatch } from "./tiered-approval-batch.js";

/** A rule a tiered approval batch must pass. Check returns its problems, or none. */
export interface TieredApprovalBatchRule {
  check(item: TieredApprovalBatch): string[];
}

export class TieredApprovalBatchRequiredNotesRule implements TieredApprovalBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredApprovalBatch): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class TieredApprovalBatchPinnedGuardRule implements TieredApprovalBatchRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TieredApprovalBatch): string[] {
    if (item.pinned && item.discount > this.limit) return [`discount ${item.discount} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class TieredApprovalBatchRetriesRangeRule implements TieredApprovalBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredApprovalBatch): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered approval batch. */
export class TieredApprovalBatchValidator {
  rules: TieredApprovalBatchRule[];

  constructor(rules: TieredApprovalBatchRule[]) {
    this.rules = rules;
  }

  validate(item: TieredApprovalBatch): string[] {
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

  requireValid(item: TieredApprovalBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredApprovalBatch[]): Map<string, string[]> {
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

export function defaultTieredApprovalBatchValidator(): TieredApprovalBatchValidator {
  return new TieredApprovalBatchValidator(
    [
      new TieredApprovalBatchRequiredNotesRule("tiered approval batch needs a value"),
      new TieredApprovalBatchPinnedGuardRule(2.5),
      new TieredApprovalBatchRetriesRangeRule(64, 64),
    ],
  );
}
