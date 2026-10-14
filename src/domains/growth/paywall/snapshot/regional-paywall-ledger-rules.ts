import * as text from "../../../../kit/text.js";
import { RegionalPaywallLedger } from "./regional-paywall-ledger.js";

/** A rule a regional paywall ledger must pass. Check returns its problems, or none. */
export interface RegionalPaywallLedgerRule {
  check(item: RegionalPaywallLedger): string[];
}

export class RegionalPaywallLedgerSendAtRangeRule implements RegionalPaywallLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalPaywallLedger): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalPaywallLedgerDiscountRangeRule implements RegionalPaywallLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalPaywallLedger): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalPaywallLedgerAllowedContactEmailRule implements RegionalPaywallLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalPaywallLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is too long`];
    return [];
  }
}

export class RegionalPaywallLedgerContactEmailLengthRule implements RegionalPaywallLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPaywallLedger): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalPaywallLedgerLabelLengthRule implements RegionalPaywallLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPaywallLedger): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional paywall ledger. */
export class RegionalPaywallLedgerValidator {
  rules: RegionalPaywallLedgerRule[];

  constructor(rules: RegionalPaywallLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalPaywallLedger): string[] {
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

  requireValid(item: RegionalPaywallLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalPaywallLedger[]): Map<string, string[]> {
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

export function defaultRegionalPaywallLedgerValidator(): RegionalPaywallLedgerValidator {
  return new RegionalPaywallLedgerValidator(
    [
      new RegionalPaywallLedgerSendAtRangeRule(64, 1000),
      new RegionalPaywallLedgerDiscountRangeRule(9.9, 3747.7),
      new RegionalPaywallLedgerAllowedContactEmailRule(["pending"]),
      new RegionalPaywallLedgerContactEmailLengthRule(255),
      new RegionalPaywallLedgerLabelLengthRule(120),
    ],
  );
}
