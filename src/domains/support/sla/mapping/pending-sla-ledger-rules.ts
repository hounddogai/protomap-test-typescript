import { PendingSlaLedger } from "./pending-sla-ledger.js";

/** A rule a pending sla ledger must pass. Check returns its problems, or none. */
export interface PendingSlaLedgerRule {
  check(item: PendingSlaLedger): string[];
}

export class PendingSlaLedgerCodeLengthRule implements PendingSlaLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingSlaLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingSlaLedgerArchivedGuardRule implements PendingSlaLedgerRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingSlaLedger): string[] {
    if (item.archived && item.limit > this.limit) return [`limit ${item.limit} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class PendingSlaLedgerRetriesRangeRule implements PendingSlaLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingSlaLedger): string[] {
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

/** Runs every rule of a pending sla ledger. */
export class PendingSlaLedgerValidator {
  rules: PendingSlaLedgerRule[];

  constructor(rules: PendingSlaLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: PendingSlaLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingSlaLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingSlaLedger[]): Map<string, string[]> {
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

export function defaultPendingSlaLedgerValidator(): PendingSlaLedgerValidator {
  return new PendingSlaLedgerValidator(
    [
      new PendingSlaLedgerCodeLengthRule(120),
      new PendingSlaLedgerArchivedGuardRule(86400),
      new PendingSlaLedgerRetriesRangeRule(32, 80),
    ],
  );
}
