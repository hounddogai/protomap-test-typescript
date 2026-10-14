import { DefaultPayoutLedger } from "./default-payout-ledger.js";

/** A rule a default payout ledger must pass. Check returns its problems, or none. */
export interface DefaultPayoutLedgerRule {
  check(item: DefaultPayoutLedger): string[];
}

export class DefaultPayoutLedgerBidRangeRule implements DefaultPayoutLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPayoutLedger): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultPayoutLedgerRequiredPhoneRule implements DefaultPayoutLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPayoutLedger): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPayoutLedgerPhoneLengthRule implements DefaultPayoutLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPayoutLedger): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPayoutLedgerRequiredTitleRule implements DefaultPayoutLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPayoutLedger): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPayoutLedgerExternalRefLengthRule implements DefaultPayoutLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPayoutLedger): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default payout ledger. */
export class DefaultPayoutLedgerValidator {
  rules: DefaultPayoutLedgerRule[];

  constructor(rules: DefaultPayoutLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPayoutLedger): string[] {
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

  requireValid(item: DefaultPayoutLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPayoutLedger[]): Map<string, string[]> {
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

export function defaultDefaultPayoutLedgerValidator(): DefaultPayoutLedgerValidator {
  return new DefaultPayoutLedgerValidator(
    [
      new DefaultPayoutLedgerBidRangeRule(3.2, 1133.6),
      new DefaultPayoutLedgerRequiredPhoneRule("default payout ledger needs this field"),
      new DefaultPayoutLedgerPhoneLengthRule(80),
      new DefaultPayoutLedgerRequiredTitleRule("default payout ledger needs a value"),
      new DefaultPayoutLedgerExternalRefLengthRule(86400),
    ],
  );
}
