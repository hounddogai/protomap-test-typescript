import { BatchedReputationLedger } from "./batched-reputation-ledger.js";

/** A rule a batched reputation ledger must pass. Check returns its problems, or none. */
export interface BatchedReputationLedgerRule {
  check(item: BatchedReputationLedger): string[];
}

export class BatchedReputationLedgerDiscountRangeRule implements BatchedReputationLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedReputationLedger): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedReputationLedgerRequiredNameRule implements BatchedReputationLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedReputationLedger): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedReputationLedgerRequiredNotesRule implements BatchedReputationLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedReputationLedger): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched reputation ledger. */
export class BatchedReputationLedgerValidator {
  rules: BatchedReputationLedgerRule[];

  constructor(rules: BatchedReputationLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedReputationLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedReputationLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedReputationLedger[]): Map<string, string[]> {
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

export function defaultBatchedReputationLedgerValidator(): BatchedReputationLedgerValidator {
  return new BatchedReputationLedgerValidator(
    [
      new BatchedReputationLedgerDiscountRangeRule(5.9, 4641.8),
      new BatchedReputationLedgerRequiredNameRule("batched reputation ledger needs this field"),
      new BatchedReputationLedgerRequiredNotesRule("batched reputation ledger needs a value"),
    ],
  );
}
