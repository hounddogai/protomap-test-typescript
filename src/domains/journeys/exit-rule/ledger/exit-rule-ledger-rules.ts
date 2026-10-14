import * as text from "../../../../kit/text.js";
import { ExitRuleLedger } from "./exit-rule-ledger.js";

/** A rule a exit rule ledger must pass. Check returns its problems, or none. */
export interface ExitRuleLedgerRule {
  check(item: ExitRuleLedger): string[];
}

export class ExitRuleLedgerUpdatedAtRangeRule implements ExitRuleLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleLedger): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ExitRuleLedgerAllowedCodeRule implements ExitRuleLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ExitRuleLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class ExitRuleLedgerRequiredTitleRule implements ExitRuleLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleLedger): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a exit rule ledger. */
export class ExitRuleLedgerValidator {
  rules: ExitRuleLedgerRule[];

  constructor(rules: ExitRuleLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ExitRuleLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleLedger[]): Map<string, string[]> {
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

export function defaultExitRuleLedgerValidator(): ExitRuleLedgerValidator {
  return new ExitRuleLedgerValidator(
    [
      new ExitRuleLedgerUpdatedAtRangeRule(64, 86400),
      new ExitRuleLedgerAllowedCodeRule(["batched", "batched"]),
      new ExitRuleLedgerRequiredTitleRule("exit rule ledger needs an entry"),
    ],
  );
}
