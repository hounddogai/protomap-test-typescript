import * as text from "../../../../kit/text.js";
import { ReputationLedger } from "./reputation-ledger.js";

/** A rule a reputation ledger must pass. Check returns its problems, or none. */
export interface ReputationLedgerRule {
  check(item: ReputationLedger): string[];
}

export class ReputationLedgerRequiredLabelRule implements ReputationLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationLedger): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationLedgerRequiredCodeRule implements ReputationLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationLedgerRequiredNotesRule implements ReputationLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationLedger): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationLedgerRequiredCampaignRefRule implements ReputationLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationLedger): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationLedgerAllowedLabelRule implements ReputationLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReputationLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is missing`];
    return [];
  }
}

export class ReputationLedgerLabelLengthRule implements ReputationLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationLedger): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reputation ledger. */
export class ReputationLedgerValidator {
  rules: ReputationLedgerRule[];

  constructor(rules: ReputationLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReputationLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationLedger[]): Map<string, string[]> {
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

export function defaultReputationLedgerValidator(): ReputationLedgerValidator {
  return new ReputationLedgerValidator(
    [
      new ReputationLedgerRequiredLabelRule("reputation ledger needs an entry"),
      new ReputationLedgerRequiredCodeRule("reputation ledger needs a value"),
      new ReputationLedgerRequiredNotesRule("reputation ledger needs an entry"),
      new ReputationLedgerRequiredCampaignRefRule("reputation ledger needs an entry"),
      new ReputationLedgerAllowedLabelRule(["pending", "seasonal", "pending"]),
      new ReputationLedgerLabelLengthRule(16),
    ],
  );
}
