import { CappedSlaLedger } from "./capped-sla-ledger.js";

/** A rule a capped sla ledger must pass. Check returns its problems, or none. */
export interface CappedSlaLedgerRule {
  check(item: CappedSlaLedger): string[];
}

export class CappedSlaLedgerReviewerLengthRule implements CappedSlaLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedSlaLedger): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedSlaLedgerRequiredCodeRule implements CappedSlaLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedSlaLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedSlaLedgerRequiredLocaleRule implements CappedSlaLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedSlaLedger): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class CappedSlaLedgerLabelLengthRule implements CappedSlaLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedSlaLedger): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped sla ledger. */
export class CappedSlaLedgerValidator {
  rules: CappedSlaLedgerRule[];

  constructor(rules: CappedSlaLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: CappedSlaLedger): string[] {
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

  requireValid(item: CappedSlaLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedSlaLedger[]): Map<string, string[]> {
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

export function defaultCappedSlaLedgerValidator(): CappedSlaLedgerValidator {
  return new CappedSlaLedgerValidator(
    [
      new CappedSlaLedgerReviewerLengthRule(86400),
      new CappedSlaLedgerRequiredCodeRule("capped sla ledger needs an entry"),
      new CappedSlaLedgerRequiredLocaleRule("capped sla ledger needs an entry"),
      new CappedSlaLedgerLabelLengthRule(86400),
    ],
  );
}
