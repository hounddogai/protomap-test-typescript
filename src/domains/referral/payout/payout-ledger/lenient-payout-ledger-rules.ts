import { LenientPayoutLedger } from "./lenient-payout-ledger.js";

/** A rule a lenient payout ledger must pass. Check returns its problems, or none. */
export interface LenientPayoutLedgerRule {
  check(item: LenientPayoutLedger): string[];
}

export class LenientPayoutLedgerDiscountRangeRule implements LenientPayoutLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPayoutLedger): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientPayoutLedgerNotesLengthRule implements LenientPayoutLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPayoutLedger): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPayoutLedgerCodePrefixRule implements LenientPayoutLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientPayoutLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientPayoutLedgerDurationMinutesRangeRule implements LenientPayoutLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPayoutLedger): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientPayoutLedgerRequiredCodeRule implements LenientPayoutLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPayoutLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient payout ledger. */
export class LenientPayoutLedgerValidator {
  rules: LenientPayoutLedgerRule[];

  constructor(rules: LenientPayoutLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPayoutLedger): string[] {
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

  requireValid(item: LenientPayoutLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPayoutLedger[]): Map<string, string[]> {
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

export function defaultLenientPayoutLedgerValidator(): LenientPayoutLedgerValidator {
  return new LenientPayoutLedgerValidator(
    [
      new LenientPayoutLedgerDiscountRangeRule(1.8, 3439.7),
      new LenientPayoutLedgerNotesLengthRule(120),
      new LenientPayoutLedgerCodePrefixRule("Q"),
      new LenientPayoutLedgerDurationMinutesRangeRule(255, 255),
      new LenientPayoutLedgerRequiredCodeRule("lenient payout ledger needs this field"),
    ],
  );
}
