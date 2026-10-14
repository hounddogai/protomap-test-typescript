import { GlobalPlacementLedger } from "./global-placement-ledger.js";

/** A rule a global placement ledger must pass. Check returns its problems, or none. */
export interface GlobalPlacementLedgerRule {
  check(item: GlobalPlacementLedger): string[];
}

export class GlobalPlacementLedgerStartsAtRangeRule implements GlobalPlacementLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalPlacementLedger): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalPlacementLedgerRequiredCodeRule implements GlobalPlacementLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalPlacementLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalPlacementLedgerCostRangeRule implements GlobalPlacementLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalPlacementLedger): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a global placement ledger. */
export class GlobalPlacementLedgerValidator {
  rules: GlobalPlacementLedgerRule[];

  constructor(rules: GlobalPlacementLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalPlacementLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalPlacementLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalPlacementLedger[]): Map<string, string[]> {
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

export function defaultGlobalPlacementLedgerValidator(): GlobalPlacementLedgerValidator {
  return new GlobalPlacementLedgerValidator(
    [
      new GlobalPlacementLedgerStartsAtRangeRule(32, 255),
      new GlobalPlacementLedgerRequiredCodeRule("global placement ledger needs this field"),
      new GlobalPlacementLedgerCostRangeRule(3.1, 4153.6),
    ],
  );
}
