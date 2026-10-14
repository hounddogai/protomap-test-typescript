import * as text from "../../../../kit/text.js";
import { PendingPayoutLedger } from "./pending-payout-ledger.js";

/** A rule a pending payout ledger must pass. Check returns its problems, or none. */
export interface PendingPayoutLedgerRule {
  check(item: PendingPayoutLedger): string[];
}

export class PendingPayoutLedgerThresholdRangeRule implements PendingPayoutLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingPayoutLedger): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingPayoutLedgerAttemptsRangeRule implements PendingPayoutLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingPayoutLedger): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingPayoutLedgerLabelLengthRule implements PendingPayoutLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPayoutLedger): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingPayoutLedgerAllowedCodeRule implements PendingPayoutLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingPayoutLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

/** Runs every rule of a pending payout ledger. */
export class PendingPayoutLedgerValidator {
  rules: PendingPayoutLedgerRule[];

  constructor(rules: PendingPayoutLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: PendingPayoutLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingPayoutLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingPayoutLedger[]): Map<string, string[]> {
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

export function defaultPendingPayoutLedgerValidator(): PendingPayoutLedgerValidator {
  return new PendingPayoutLedgerValidator(
    [
      new PendingPayoutLedgerThresholdRangeRule(8, 1851.6),
      new PendingPayoutLedgerAttemptsRangeRule(16, 16),
      new PendingPayoutLedgerLabelLengthRule(64),
      new PendingPayoutLedgerAllowedCodeRule(["scheduled", "tiered"]),
    ],
  );
}
