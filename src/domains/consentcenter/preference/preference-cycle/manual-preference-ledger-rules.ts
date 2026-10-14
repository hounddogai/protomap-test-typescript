import * as text from "../../../../kit/text.js";
import { ManualPreferenceLedger } from "./manual-preference-ledger.js";

/** A rule a manual preference ledger must pass. Check returns its problems, or none. */
export interface ManualPreferenceLedgerRule {
  check(item: ManualPreferenceLedger): string[];
}

export class ManualPreferenceLedgerSummaryLengthRule implements ManualPreferenceLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPreferenceLedger): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPreferenceLedgerRequiredCodeRule implements ManualPreferenceLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPreferenceLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPreferenceLedgerRequiredNameRule implements ManualPreferenceLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPreferenceLedger): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPreferenceLedgerAllowedSummaryRule implements ManualPreferenceLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualPreferenceLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is unknown`];
    return [];
  }
}

export class ManualPreferenceLedgerCodePrefixRule implements ManualPreferenceLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualPreferenceLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualPreferenceLedgerRequiredSummaryRule implements ManualPreferenceLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPreferenceLedger): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual preference ledger. */
export class ManualPreferenceLedgerValidator {
  rules: ManualPreferenceLedgerRule[];

  constructor(rules: ManualPreferenceLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPreferenceLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualPreferenceLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPreferenceLedger[]): Map<string, string[]> {
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

export function defaultManualPreferenceLedgerValidator(): ManualPreferenceLedgerValidator {
  return new ManualPreferenceLedgerValidator(
    [
      new ManualPreferenceLedgerSummaryLengthRule(64),
      new ManualPreferenceLedgerRequiredCodeRule("manual preference ledger needs an entry"),
      new ManualPreferenceLedgerRequiredNameRule("manual preference ledger needs this field"),
      new ManualPreferenceLedgerAllowedSummaryRule(["default"]),
      new ManualPreferenceLedgerCodePrefixRule("ACM"),
      new ManualPreferenceLedgerRequiredSummaryRule("manual preference ledger needs this field"),
    ],
  );
}
