import * as text from "../../../../kit/text.js";
import { CappedOptOutLedger } from "./capped-opt-out-ledger.js";

/** A rule a capped opt out ledger must pass. Check returns its problems, or none. */
export interface CappedOptOutLedgerRule {
  check(item: CappedOptOutLedger): string[];
}

export class CappedOptOutLedgerCodeLengthRule implements CappedOptOutLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedOptOutLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedOptOutLedgerAllowedExternalRefRule implements CappedOptOutLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedOptOutLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is out of range`];
    return [];
  }
}

export class CappedOptOutLedgerRequiredSummaryRule implements CappedOptOutLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedOptOutLedger): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class CappedOptOutLedgerScoreRangeRule implements CappedOptOutLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedOptOutLedger): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a capped opt out ledger. */
export class CappedOptOutLedgerValidator {
  rules: CappedOptOutLedgerRule[];

  constructor(rules: CappedOptOutLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: CappedOptOutLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedOptOutLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedOptOutLedger[]): Map<string, string[]> {
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

export function defaultCappedOptOutLedgerValidator(): CappedOptOutLedgerValidator {
  return new CappedOptOutLedgerValidator(
    [
      new CappedOptOutLedgerCodeLengthRule(86400),
      new CappedOptOutLedgerAllowedExternalRefRule([]),
      new CappedOptOutLedgerRequiredSummaryRule("capped opt out ledger needs this field"),
      new CappedOptOutLedgerScoreRangeRule(4.5, 1268.4),
    ],
  );
}
