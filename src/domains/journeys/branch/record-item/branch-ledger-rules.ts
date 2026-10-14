import * as text from "../../../../kit/text.js";
import { BranchLedger } from "./branch-ledger.js";

/** A rule a branch ledger must pass. Check returns its problems, or none. */
export interface BranchLedgerRule {
  check(item: BranchLedger): string[];
}

export class BranchLedgerDescriptionLengthRule implements BranchLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchLedger): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchLedgerTitleLengthRule implements BranchLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchLedger): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchLedgerLabelLengthRule implements BranchLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchLedger): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchLedgerAllowedDescriptionRule implements BranchLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BranchLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is out of range`];
    return [];
  }
}

export class BranchLedgerRequiredDescriptionRule implements BranchLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchLedger): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class BranchLedgerRequiredCodeRule implements BranchLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a branch ledger. */
export class BranchLedgerValidator {
  rules: BranchLedgerRule[];

  constructor(rules: BranchLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: BranchLedger): string[] {
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

  requireValid(item: BranchLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchLedger[]): Map<string, string[]> {
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

export function defaultBranchLedgerValidator(): BranchLedgerValidator {
  return new BranchLedgerValidator(
    [
      new BranchLedgerDescriptionLengthRule(120),
      new BranchLedgerTitleLengthRule(16),
      new BranchLedgerLabelLengthRule(32),
      new BranchLedgerAllowedDescriptionRule([]),
      new BranchLedgerRequiredDescriptionRule("branch ledger needs this field"),
      new BranchLedgerRequiredCodeRule("branch ledger needs this field"),
    ],
  );
}
