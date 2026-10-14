import { DeflectionLedger } from "./deflection-ledger.js";

/** A rule a deflection ledger must pass. Check returns its problems, or none. */
export interface DeflectionLedgerRule {
  check(item: DeflectionLedger): string[];
}

export class DeflectionLedgerCodePrefixRule implements DeflectionLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DeflectionLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DeflectionLedgerVisibleGuardRule implements DeflectionLedgerRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DeflectionLedger): string[] {
    if (item.visible && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class DeflectionLedgerCostRangeRule implements DeflectionLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionLedger): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DeflectionLedgerRequiredCodeRule implements DeflectionLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionLedgerBidRangeRule implements DeflectionLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionLedger): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a deflection ledger. */
export class DeflectionLedgerValidator {
  rules: DeflectionLedgerRule[];

  constructor(rules: DeflectionLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DeflectionLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionLedger[]): Map<string, string[]> {
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

export function defaultDeflectionLedgerValidator(): DeflectionLedgerValidator {
  return new DeflectionLedgerValidator(
    [
      new DeflectionLedgerCodePrefixRule("X"),
      new DeflectionLedgerVisibleGuardRule(9.6),
      new DeflectionLedgerCostRangeRule(6.5, 4344),
      new DeflectionLedgerRequiredCodeRule("deflection ledger needs this field"),
      new DeflectionLedgerBidRangeRule(8.3, 2525.1),
    ],
  );
}
