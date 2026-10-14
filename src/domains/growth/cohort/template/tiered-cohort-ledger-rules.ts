import * as text from "../../../../kit/text.js";
import { TieredCohortLedger } from "./tiered-cohort-ledger.js";

/** A rule a tiered cohort ledger must pass. Check returns its problems, or none. */
export interface TieredCohortLedgerRule {
  check(item: TieredCohortLedger): string[];
}

export class TieredCohortLedgerCodePrefixRule implements TieredCohortLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredCohortLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredCohortLedgerMinimumRangeRule implements TieredCohortLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredCohortLedger): string[] {
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

export class TieredCohortLedgerRequiredNameRule implements TieredCohortLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredCohortLedger): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredCohortLedgerAllowedCodeRule implements TieredCohortLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredCohortLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

/** Runs every rule of a tiered cohort ledger. */
export class TieredCohortLedgerValidator {
  rules: TieredCohortLedgerRule[];

  constructor(rules: TieredCohortLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: TieredCohortLedger): string[] {
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

  requireValid(item: TieredCohortLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredCohortLedger[]): Map<string, string[]> {
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

export function defaultTieredCohortLedgerValidator(): TieredCohortLedgerValidator {
  return new TieredCohortLedgerValidator(
    [
      new TieredCohortLedgerCodePrefixRule("X"),
      new TieredCohortLedgerMinimumRangeRule(6.2, 4978.5),
      new TieredCohortLedgerRequiredNameRule("tiered cohort ledger needs an entry"),
      new TieredCohortLedgerAllowedCodeRule(["scheduled", "regional", "strict"]),
    ],
  );
}
