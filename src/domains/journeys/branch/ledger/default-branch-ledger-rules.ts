import * as text from "../../../../kit/text.js";
import { DefaultBranchLedger } from "./default-branch-ledger.js";

/** A rule a default branch ledger must pass. Check returns its problems, or none. */
export interface DefaultBranchLedgerRule {
  check(item: DefaultBranchLedger): string[];
}

export class DefaultBranchLedgerAllowedCodeRule implements DefaultBranchLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultBranchLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class DefaultBranchLedgerLimitRangeRule implements DefaultBranchLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultBranchLedger): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultBranchLedgerSequenceRangeRule implements DefaultBranchLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultBranchLedger): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a default branch ledger. */
export class DefaultBranchLedgerValidator {
  rules: DefaultBranchLedgerRule[];

  constructor(rules: DefaultBranchLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultBranchLedger): string[] {
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

  requireValid(item: DefaultBranchLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultBranchLedger[]): Map<string, string[]> {
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

export function defaultDefaultBranchLedgerValidator(): DefaultBranchLedgerValidator {
  return new DefaultBranchLedgerValidator(
    [
      new DefaultBranchLedgerAllowedCodeRule(["batched", "primary", "regional"]),
      new DefaultBranchLedgerLimitRangeRule(64, 86400),
      new DefaultBranchLedgerSequenceRangeRule(120, 255),
    ],
  );
}
