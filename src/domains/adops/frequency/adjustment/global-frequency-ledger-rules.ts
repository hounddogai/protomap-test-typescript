import { GlobalFrequencyLedger } from "./global-frequency-ledger.js";

/** A rule a global frequency ledger must pass. Check returns its problems, or none. */
export interface GlobalFrequencyLedgerRule {
  check(item: GlobalFrequencyLedger): string[];
}

export class GlobalFrequencyLedgerCreatedAtRangeRule implements GlobalFrequencyLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalFrequencyLedger): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalFrequencyLedgerBidRangeRule implements GlobalFrequencyLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalFrequencyLedger): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalFrequencyLedgerRequiredTitleRule implements GlobalFrequencyLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalFrequencyLedger): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global frequency ledger. */
export class GlobalFrequencyLedgerValidator {
  rules: GlobalFrequencyLedgerRule[];

  constructor(rules: GlobalFrequencyLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalFrequencyLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalFrequencyLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalFrequencyLedger[]): Map<string, string[]> {
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

export function defaultGlobalFrequencyLedgerValidator(): GlobalFrequencyLedgerValidator {
  return new GlobalFrequencyLedgerValidator(
    [
      new GlobalFrequencyLedgerCreatedAtRangeRule(64, 3600),
      new GlobalFrequencyLedgerBidRangeRule(6.3, 3060),
      new GlobalFrequencyLedgerRequiredTitleRule("global frequency ledger needs this field"),
    ],
  );
}
