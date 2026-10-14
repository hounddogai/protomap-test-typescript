import { WaitLedger } from "./wait-ledger.js";

/** A rule a wait ledger must pass. Check returns its problems, or none. */
export interface WaitLedgerRule {
  check(item: WaitLedger): string[];
}

export class WaitLedgerScoreRangeRule implements WaitLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitLedger): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WaitLedgerNameLengthRule implements WaitLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitLedger): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitLedgerWindowDaysRangeRule implements WaitLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitLedger): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WaitLedgerPinnedGuardRule implements WaitLedgerRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WaitLedger): string[] {
    if (item.pinned && item.windowDays > this.limit) return [`window days ${item.windowDays} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a wait ledger. */
export class WaitLedgerValidator {
  rules: WaitLedgerRule[];

  constructor(rules: WaitLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: WaitLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WaitLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitLedger[]): Map<string, string[]> {
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

export function defaultWaitLedgerValidator(): WaitLedgerValidator {
  return new WaitLedgerValidator(
    [
      new WaitLedgerScoreRangeRule(5.9, 365.4),
      new WaitLedgerNameLengthRule(86400),
      new WaitLedgerWindowDaysRangeRule(80, 3600),
      new WaitLedgerPinnedGuardRule(1000),
    ],
  );
}
