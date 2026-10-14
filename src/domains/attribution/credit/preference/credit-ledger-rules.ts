import { CreditLedger } from "./credit-ledger.js";

/** A rule a credit ledger must pass. Check returns its problems, or none. */
export interface CreditLedgerRule {
  check(item: CreditLedger): string[];
}

export class CreditLedgerCodeLengthRule implements CreditLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditLedgerRequiredCodeRule implements CreditLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreditLedgerRequiredDescriptionRule implements CreditLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditLedger): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class CreditLedgerRequiredLocaleRule implements CreditLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditLedger): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class CreditLedgerDescriptionLengthRule implements CreditLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditLedger): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditLedgerSequenceRangeRule implements CreditLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditLedger): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a credit ledger. */
export class CreditLedgerValidator {
  rules: CreditLedgerRule[];

  constructor(rules: CreditLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: CreditLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreditLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditLedger[]): Map<string, string[]> {
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

export function defaultCreditLedgerValidator(): CreditLedgerValidator {
  return new CreditLedgerValidator(
    [
      new CreditLedgerCodeLengthRule(1000),
      new CreditLedgerRequiredCodeRule("credit ledger needs this field"),
      new CreditLedgerRequiredDescriptionRule("credit ledger needs a value"),
      new CreditLedgerRequiredLocaleRule("credit ledger needs a value"),
      new CreditLedgerDescriptionLengthRule(255),
      new CreditLedgerSequenceRangeRule(64, 3600),
    ],
  );
}
