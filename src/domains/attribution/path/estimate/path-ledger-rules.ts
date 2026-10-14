import { PathLedger } from "./path-ledger.js";

/** A rule a path ledger must pass. Check returns its problems, or none. */
export interface PathLedgerRule {
  check(item: PathLedger): string[];
}

export class PathLedgerRequiredTimezoneRule implements PathLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathLedger): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class PathLedgerRequiredCohortRule implements PathLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathLedger): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class PathLedgerTimezoneLengthRule implements PathLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathLedger): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathLedgerRequiredTitleRule implements PathLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathLedger): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a path ledger. */
export class PathLedgerValidator {
  rules: PathLedgerRule[];

  constructor(rules: PathLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: PathLedger): string[] {
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

  requireValid(item: PathLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathLedger[]): Map<string, string[]> {
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

export function defaultPathLedgerValidator(): PathLedgerValidator {
  return new PathLedgerValidator(
    [
      new PathLedgerRequiredTimezoneRule("path ledger needs this field"),
      new PathLedgerRequiredCohortRule("path ledger needs a value"),
      new PathLedgerTimezoneLengthRule(255),
      new PathLedgerRequiredTitleRule("path ledger needs an entry"),
    ],
  );
}
