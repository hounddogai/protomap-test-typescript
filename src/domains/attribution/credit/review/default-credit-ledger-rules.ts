import { DefaultCreditLedger } from "./default-credit-ledger.js";

/** A rule a default credit ledger must pass. Check returns its problems, or none. */
export interface DefaultCreditLedgerRule {
  check(item: DefaultCreditLedger): string[];
}

export class DefaultCreditLedgerTitleLengthRule implements DefaultCreditLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultCreditLedger): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultCreditLedgerRequiredTitleRule implements DefaultCreditLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultCreditLedger): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultCreditLedgerRequiredSegmentRule implements DefaultCreditLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultCreditLedger): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default credit ledger. */
export class DefaultCreditLedgerValidator {
  rules: DefaultCreditLedgerRule[];

  constructor(rules: DefaultCreditLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultCreditLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultCreditLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultCreditLedger[]): Map<string, string[]> {
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

export function defaultDefaultCreditLedgerValidator(): DefaultCreditLedgerValidator {
  return new DefaultCreditLedgerValidator(
    [
      new DefaultCreditLedgerTitleLengthRule(80),
      new DefaultCreditLedgerRequiredTitleRule("default credit ledger needs a value"),
      new DefaultCreditLedgerRequiredSegmentRule("default credit ledger needs this field"),
    ],
  );
}
