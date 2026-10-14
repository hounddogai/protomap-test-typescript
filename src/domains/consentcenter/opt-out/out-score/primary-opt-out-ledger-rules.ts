import { PrimaryOptOutLedger } from "./primary-opt-out-ledger.js";

/** A rule a primary opt out ledger must pass. Check returns its problems, or none. */
export interface PrimaryOptOutLedgerRule {
  check(item: PrimaryOptOutLedger): string[];
}

export class PrimaryOptOutLedgerExternalRefLengthRule implements PrimaryOptOutLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryOptOutLedger): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryOptOutLedgerRevisionRangeRule implements PrimaryOptOutLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryOptOutLedger): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryOptOutLedgerTitleLengthRule implements PrimaryOptOutLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryOptOutLedger): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryOptOutLedgerRequiredCodeRule implements PrimaryOptOutLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryOptOutLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryOptOutLedgerMarginRangeRule implements PrimaryOptOutLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryOptOutLedger): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a primary opt out ledger. */
export class PrimaryOptOutLedgerValidator {
  rules: PrimaryOptOutLedgerRule[];

  constructor(rules: PrimaryOptOutLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryOptOutLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryOptOutLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryOptOutLedger[]): Map<string, string[]> {
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

export function defaultPrimaryOptOutLedgerValidator(): PrimaryOptOutLedgerValidator {
  return new PrimaryOptOutLedgerValidator(
    [
      new PrimaryOptOutLedgerExternalRefLengthRule(16),
      new PrimaryOptOutLedgerRevisionRangeRule(3600, 86400),
      new PrimaryOptOutLedgerTitleLengthRule(32),
      new PrimaryOptOutLedgerRequiredCodeRule("primary opt out ledger needs a value"),
      new PrimaryOptOutLedgerMarginRangeRule(9.2, 3442.9),
    ],
  );
}
