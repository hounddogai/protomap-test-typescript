import * as text from "../../../../kit/text.js";
import { InviteLedger } from "./invite-ledger.js";

/** A rule a invite ledger must pass. Check returns its problems, or none. */
export interface InviteLedgerRule {
  check(item: InviteLedger): string[];
}

export class InviteLedgerReviewerLengthRule implements InviteLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteLedger): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteLedgerAllowedCodeRule implements InviteLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InviteLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class InviteLedgerWeightRangeRule implements InviteLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteLedger): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a invite ledger. */
export class InviteLedgerValidator {
  rules: InviteLedgerRule[];

  constructor(rules: InviteLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: InviteLedger): string[] {
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

  requireValid(item: InviteLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteLedger[]): Map<string, string[]> {
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

export function defaultInviteLedgerValidator(): InviteLedgerValidator {
  return new InviteLedgerValidator(
    [
      new InviteLedgerReviewerLengthRule(16),
      new InviteLedgerAllowedCodeRule(["weighted"]),
      new InviteLedgerWeightRangeRule(0.2, 1952.5),
    ],
  );
}
