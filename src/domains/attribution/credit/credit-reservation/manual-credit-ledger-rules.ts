import * as text from "../../../../kit/text.js";
import { ManualCreditLedger } from "./manual-credit-ledger.js";

/** A rule a manual credit ledger must pass. Check returns its problems, or none. */
export interface ManualCreditLedgerRule {
  check(item: ManualCreditLedger): string[];
}

export class ManualCreditLedgerCodeLengthRule implements ManualCreditLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualCreditLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualCreditLedgerVersionRangeRule implements ManualCreditLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualCreditLedger): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualCreditLedgerWeightRangeRule implements ManualCreditLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualCreditLedger): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualCreditLedgerAllowedCodeRule implements ManualCreditLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualCreditLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class ManualCreditLedgerRetriesRangeRule implements ManualCreditLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualCreditLedger): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual credit ledger. */
export class ManualCreditLedgerValidator {
  rules: ManualCreditLedgerRule[];

  constructor(rules: ManualCreditLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: ManualCreditLedger): string[] {
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

  requireValid(item: ManualCreditLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualCreditLedger[]): Map<string, string[]> {
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

export function defaultManualCreditLedgerValidator(): ManualCreditLedgerValidator {
  return new ManualCreditLedgerValidator(
    [
      new ManualCreditLedgerCodeLengthRule(255),
      new ManualCreditLedgerVersionRangeRule(64, 255),
      new ManualCreditLedgerWeightRangeRule(0.6, 2396.8),
      new ManualCreditLedgerAllowedCodeRule(["regional", "pending"]),
      new ManualCreditLedgerRetriesRangeRule(64, 86400),
    ],
  );
}
