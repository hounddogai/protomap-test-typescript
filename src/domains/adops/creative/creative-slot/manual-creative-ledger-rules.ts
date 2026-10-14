import { ManualCreativeLedger } from "./manual-creative-ledger.js";

/** A rule a manual creative ledger must pass. Check returns its problems, or none. */
export interface ManualCreativeLedgerRule {
  check(item: ManualCreativeLedger): string[];
}

export class ManualCreativeLedgerCountryLengthRule implements ManualCreativeLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualCreativeLedger): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualCreativeLedgerRequiredTitleRule implements ManualCreativeLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualCreativeLedger): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ManualCreativeLedgerAmountRangeRule implements ManualCreativeLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualCreativeLedger): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualCreativeLedgerWindowDaysRangeRule implements ManualCreativeLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualCreativeLedger): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualCreativeLedgerTitleLengthRule implements ManualCreativeLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualCreativeLedger): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual creative ledger. */
export class ManualCreativeLedgerValidator {
  rules: ManualCreativeLedgerRule[];

  constructor(rules: ManualCreativeLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: ManualCreativeLedger): string[] {
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

  requireValid(item: ManualCreativeLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualCreativeLedger[]): Map<string, string[]> {
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

export function defaultManualCreativeLedgerValidator(): ManualCreativeLedgerValidator {
  return new ManualCreativeLedgerValidator(
    [
      new ManualCreativeLedgerCountryLengthRule(32),
      new ManualCreativeLedgerRequiredTitleRule("manual creative ledger needs a value"),
      new ManualCreativeLedgerAmountRangeRule(0.3, 2751.8),
      new ManualCreativeLedgerWindowDaysRangeRule(64, 3600),
      new ManualCreativeLedgerTitleLengthRule(64),
    ],
  );
}
