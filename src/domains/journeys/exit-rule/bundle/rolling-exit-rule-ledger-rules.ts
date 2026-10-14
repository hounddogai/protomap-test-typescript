import { RollingExitRuleLedger } from "./rolling-exit-rule-ledger.js";

/** A rule a rolling exit rule ledger must pass. Check returns its problems, or none. */
export interface RollingExitRuleLedgerRule {
  check(item: RollingExitRuleLedger): string[];
}

export class RollingExitRuleLedgerBudgetRangeRule implements RollingExitRuleLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingExitRuleLedger): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingExitRuleLedgerRetriesRangeRule implements RollingExitRuleLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingExitRuleLedger): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingExitRuleLedgerRequiredLocaleRule implements RollingExitRuleLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingExitRuleLedger): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class RollingExitRuleLedgerRequiredNameRule implements RollingExitRuleLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingExitRuleLedger): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RollingExitRuleLedgerNameLengthRule implements RollingExitRuleLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingExitRuleLedger): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling exit rule ledger. */
export class RollingExitRuleLedgerValidator {
  rules: RollingExitRuleLedgerRule[];

  constructor(rules: RollingExitRuleLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: RollingExitRuleLedger): string[] {
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

  requireValid(item: RollingExitRuleLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingExitRuleLedger[]): Map<string, string[]> {
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

export function defaultRollingExitRuleLedgerValidator(): RollingExitRuleLedgerValidator {
  return new RollingExitRuleLedgerValidator(
    [
      new RollingExitRuleLedgerBudgetRangeRule(9.4, 2557.5),
      new RollingExitRuleLedgerRetriesRangeRule(64, 120),
      new RollingExitRuleLedgerRequiredLocaleRule("rolling exit rule ledger needs a value"),
      new RollingExitRuleLedgerRequiredNameRule("rolling exit rule ledger needs an entry"),
      new RollingExitRuleLedgerNameLengthRule(120),
    ],
  );
}
