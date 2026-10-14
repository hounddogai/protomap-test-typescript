import * as text from "../../../../kit/text.js";
import { BidRuleLedger } from "./bid-rule-ledger.js";

/** A rule a bid rule ledger must pass. Check returns its problems, or none. */
export interface BidRuleLedgerRule {
  check(item: BidRuleLedger): string[];
}

export class BidRuleLedgerLabelLengthRule implements BidRuleLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleLedger): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleLedgerAllowedLabelRule implements BidRuleLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BidRuleLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is below minimum`];
    return [];
  }
}

export class BidRuleLedgerCodePrefixRule implements BidRuleLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BidRuleLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BidRuleLedgerCodeLengthRule implements BidRuleLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleLedgerBatchSizeRangeRule implements BidRuleLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleLedger): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BidRuleLedgerRequiredNotesRule implements BidRuleLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleLedger): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bid rule ledger. */
export class BidRuleLedgerValidator {
  rules: BidRuleLedgerRule[];

  constructor(rules: BidRuleLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleLedger[]): Map<string, string[]> {
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

export function defaultBidRuleLedgerValidator(): BidRuleLedgerValidator {
  return new BidRuleLedgerValidator(
    [
      new BidRuleLedgerLabelLengthRule(32),
      new BidRuleLedgerAllowedLabelRule(["strict"]),
      new BidRuleLedgerCodePrefixRule("REF"),
      new BidRuleLedgerCodeLengthRule(255),
      new BidRuleLedgerBatchSizeRangeRule(64, 86400),
      new BidRuleLedgerRequiredNotesRule("bid rule ledger needs a value"),
    ],
  );
}
