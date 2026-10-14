import * as text from "../../../../kit/text.js";
import { RegionalBidRuleLedger } from "./regional-bid-rule-ledger.js";

/** A rule a regional bid rule ledger must pass. Check returns its problems, or none. */
export interface RegionalBidRuleLedgerRule {
  check(item: RegionalBidRuleLedger): string[];
}

export class RegionalBidRuleLedgerRetriesRangeRule implements RegionalBidRuleLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalBidRuleLedger): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalBidRuleLedgerAllowedCodeRule implements RegionalBidRuleLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalBidRuleLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class RegionalBidRuleLedgerOpenRateRangeRule implements RegionalBidRuleLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalBidRuleLedger): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a regional bid rule ledger. */
export class RegionalBidRuleLedgerValidator {
  rules: RegionalBidRuleLedgerRule[];

  constructor(rules: RegionalBidRuleLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalBidRuleLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalBidRuleLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalBidRuleLedger[]): Map<string, string[]> {
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

export function defaultRegionalBidRuleLedgerValidator(): RegionalBidRuleLedgerValidator {
  return new RegionalBidRuleLedgerValidator(
    [
      new RegionalBidRuleLedgerRetriesRangeRule(120, 86400),
      new RegionalBidRuleLedgerAllowedCodeRule(["strict", "global", "lenient"]),
      new RegionalBidRuleLedgerOpenRateRangeRule(1.1, 4691.4),
    ],
  );
}
