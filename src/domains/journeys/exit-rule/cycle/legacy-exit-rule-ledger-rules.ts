import { LegacyExitRuleLedger } from "./legacy-exit-rule-ledger.js";

/** A rule a legacy exit rule ledger must pass. Check returns its problems, or none. */
export interface LegacyExitRuleLedgerRule {
  check(item: LegacyExitRuleLedger): string[];
}

export class LegacyExitRuleLedgerCodeLengthRule implements LegacyExitRuleLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyExitRuleLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyExitRuleLedgerRequiredCodeRule implements LegacyExitRuleLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyExitRuleLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyExitRuleLedgerCountryLengthRule implements LegacyExitRuleLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyExitRuleLedger): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy exit rule ledger. */
export class LegacyExitRuleLedgerValidator {
  rules: LegacyExitRuleLedgerRule[];

  constructor(rules: LegacyExitRuleLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyExitRuleLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyExitRuleLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyExitRuleLedger[]): Map<string, string[]> {
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

export function defaultLegacyExitRuleLedgerValidator(): LegacyExitRuleLedgerValidator {
  return new LegacyExitRuleLedgerValidator(
    [
      new LegacyExitRuleLedgerCodeLengthRule(3600),
      new LegacyExitRuleLedgerRequiredCodeRule("legacy exit rule ledger needs this field"),
      new LegacyExitRuleLedgerCountryLengthRule(64),
    ],
  );
}
