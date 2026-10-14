import * as text from "../../../../kit/text.js";
import { CappedActivationLedger } from "./capped-activation-ledger.js";

/** A rule a capped activation ledger must pass. Check returns its problems, or none. */
export interface CappedActivationLedgerRule {
  check(item: CappedActivationLedger): string[];
}

export class CappedActivationLedgerAllowedTitleRule implements CappedActivationLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedActivationLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is out of range`];
    return [];
  }
}

export class CappedActivationLedgerMinimumRangeRule implements CappedActivationLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedActivationLedger): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedActivationLedgerCohortLengthRule implements CappedActivationLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedActivationLedger): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped activation ledger. */
export class CappedActivationLedgerValidator {
  rules: CappedActivationLedgerRule[];

  constructor(rules: CappedActivationLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: CappedActivationLedger): string[] {
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

  requireValid(item: CappedActivationLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedActivationLedger[]): Map<string, string[]> {
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

export function defaultCappedActivationLedgerValidator(): CappedActivationLedgerValidator {
  return new CappedActivationLedgerValidator(
    [
      new CappedActivationLedgerAllowedTitleRule(["global", "fallback"]),
      new CappedActivationLedgerMinimumRangeRule(3.9, 3634.6),
      new CappedActivationLedgerCohortLengthRule(3600),
    ],
  );
}
