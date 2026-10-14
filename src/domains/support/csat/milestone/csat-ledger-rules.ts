import * as text from "../../../../kit/text.js";
import { CsatLedger } from "./csat-ledger.js";

/** A rule a csat ledger must pass. Check returns its problems, or none. */
export interface CsatLedgerRule {
  check(item: CsatLedger): string[];
}

export class CsatLedgerMinimumRangeRule implements CsatLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatLedger): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CsatLedgerCodePrefixRule implements CsatLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CsatLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CsatLedgerAllowedCodeRule implements CsatLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CsatLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class CsatLedgerImpressionsRangeRule implements CsatLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatLedger): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CsatLedgerCodeLengthRule implements CsatLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a csat ledger. */
export class CsatLedgerValidator {
  rules: CsatLedgerRule[];

  constructor(rules: CsatLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: CsatLedger): string[] {
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

  requireValid(item: CsatLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatLedger[]): Map<string, string[]> {
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

export function defaultCsatLedgerValidator(): CsatLedgerValidator {
  return new CsatLedgerValidator(
    [
      new CsatLedgerMinimumRangeRule(1.4, 2111.5),
      new CsatLedgerCodePrefixRule("REF"),
      new CsatLedgerAllowedCodeRule([]),
      new CsatLedgerImpressionsRangeRule(64, 3600),
      new CsatLedgerCodeLengthRule(3600),
    ],
  );
}
