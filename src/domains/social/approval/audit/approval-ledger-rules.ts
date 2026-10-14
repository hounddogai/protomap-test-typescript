import * as text from "../../../../kit/text.js";
import { ApprovalLedger } from "./approval-ledger.js";

/** A rule a approval ledger must pass. Check returns its problems, or none. */
export interface ApprovalLedgerRule {
  check(item: ApprovalLedger): string[];
}

export class ApprovalLedgerMarginRangeRule implements ApprovalLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalLedger): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ApprovalLedgerRequiredOwnerIdRule implements ApprovalLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalLedger): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalLedgerRequiredCodeRule implements ApprovalLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalLedgerAllowedNameRule implements ApprovalLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ApprovalLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

/** Runs every rule of a approval ledger. */
export class ApprovalLedgerValidator {
  rules: ApprovalLedgerRule[];

  constructor(rules: ApprovalLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalLedger): string[] {
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

  requireValid(item: ApprovalLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalLedger[]): Map<string, string[]> {
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

export function defaultApprovalLedgerValidator(): ApprovalLedgerValidator {
  return new ApprovalLedgerValidator(
    [
      new ApprovalLedgerMarginRangeRule(2.3, 4688.3),
      new ApprovalLedgerRequiredOwnerIdRule("approval ledger needs a value"),
      new ApprovalLedgerRequiredCodeRule("approval ledger needs a value"),
      new ApprovalLedgerAllowedNameRule([]),
    ],
  );
}
