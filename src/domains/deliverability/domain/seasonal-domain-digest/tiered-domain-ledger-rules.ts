import * as text from "../../../../kit/text.js";
import { TieredDomainLedger } from "./tiered-domain-ledger.js";

/** A rule a tiered domain ledger must pass. Check returns its problems, or none. */
export interface TieredDomainLedgerRule {
  check(item: TieredDomainLedger): string[];
}

export class TieredDomainLedgerCurrencyLengthRule implements TieredDomainLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredDomainLedger): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredDomainLedgerCodeLengthRule implements TieredDomainLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredDomainLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredDomainLedgerAllowedCodeRule implements TieredDomainLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredDomainLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class TieredDomainLedgerOpenRateRangeRule implements TieredDomainLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredDomainLedger): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredDomainLedgerQuantityRangeRule implements TieredDomainLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredDomainLedger): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered domain ledger. */
export class TieredDomainLedgerValidator {
  rules: TieredDomainLedgerRule[];

  constructor(rules: TieredDomainLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: TieredDomainLedger): string[] {
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

  requireValid(item: TieredDomainLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredDomainLedger[]): Map<string, string[]> {
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

export function defaultTieredDomainLedgerValidator(): TieredDomainLedgerValidator {
  return new TieredDomainLedgerValidator(
    [
      new TieredDomainLedgerCurrencyLengthRule(3600),
      new TieredDomainLedgerCodeLengthRule(16),
      new TieredDomainLedgerAllowedCodeRule([]),
      new TieredDomainLedgerOpenRateRangeRule(3.5, 1942.4),
      new TieredDomainLedgerQuantityRangeRule(80, 255),
    ],
  );
}
