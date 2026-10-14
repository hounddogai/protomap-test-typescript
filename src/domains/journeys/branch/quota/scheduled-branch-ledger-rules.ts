import { ScheduledBranchLedger } from "./scheduled-branch-ledger.js";

/** A rule a scheduled branch ledger must pass. Check returns its problems, or none. */
export interface ScheduledBranchLedgerRule {
  check(item: ScheduledBranchLedger): string[];
}

export class ScheduledBranchLedgerBudgetRangeRule implements ScheduledBranchLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledBranchLedger): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledBranchLedgerRequiredTitleRule implements ScheduledBranchLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledBranchLedger): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledBranchLedgerRequiredCodeRule implements ScheduledBranchLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledBranchLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledBranchLedgerApprovedGuardRule implements ScheduledBranchLedgerRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ScheduledBranchLedger): string[] {
    if (item.approved && item.frequencyCap > this.limit) return [`frequency cap ${item.frequencyCap} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class ScheduledBranchLedgerSegmentLengthRule implements ScheduledBranchLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledBranchLedger): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledBranchLedgerFrequencyCapRangeRule implements ScheduledBranchLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledBranchLedger): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a scheduled branch ledger. */
export class ScheduledBranchLedgerValidator {
  rules: ScheduledBranchLedgerRule[];

  constructor(rules: ScheduledBranchLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledBranchLedger): string[] {
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

  requireValid(item: ScheduledBranchLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledBranchLedger[]): Map<string, string[]> {
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

export function defaultScheduledBranchLedgerValidator(): ScheduledBranchLedgerValidator {
  return new ScheduledBranchLedgerValidator(
    [
      new ScheduledBranchLedgerBudgetRangeRule(5.6, 346.7),
      new ScheduledBranchLedgerRequiredTitleRule("scheduled branch ledger needs a value"),
      new ScheduledBranchLedgerRequiredCodeRule("scheduled branch ledger needs a value"),
      new ScheduledBranchLedgerApprovedGuardRule(64),
      new ScheduledBranchLedgerSegmentLengthRule(3600),
      new ScheduledBranchLedgerFrequencyCapRangeRule(16, 32),
    ],
  );
}
