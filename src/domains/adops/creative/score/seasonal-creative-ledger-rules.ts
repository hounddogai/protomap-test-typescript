import { SeasonalCreativeLedger } from "./seasonal-creative-ledger.js";

/** A rule a seasonal creative ledger must pass. Check returns its problems, or none. */
export interface SeasonalCreativeLedgerRule {
  check(item: SeasonalCreativeLedger): string[];
}

export class SeasonalCreativeLedgerRequiredCodeRule implements SeasonalCreativeLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalCreativeLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalCreativeLedgerSendAtRangeRule implements SeasonalCreativeLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalCreativeLedger): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalCreativeLedgerQuantityRangeRule implements SeasonalCreativeLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalCreativeLedger): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalCreativeLedgerRequiredOwnerIdRule implements SeasonalCreativeLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalCreativeLedger): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal creative ledger. */
export class SeasonalCreativeLedgerValidator {
  rules: SeasonalCreativeLedgerRule[];

  constructor(rules: SeasonalCreativeLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalCreativeLedger): string[] {
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

  requireValid(item: SeasonalCreativeLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalCreativeLedger[]): Map<string, string[]> {
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

export function defaultSeasonalCreativeLedgerValidator(): SeasonalCreativeLedgerValidator {
  return new SeasonalCreativeLedgerValidator(
    [
      new SeasonalCreativeLedgerRequiredCodeRule("seasonal creative ledger needs a value"),
      new SeasonalCreativeLedgerSendAtRangeRule(16, 80),
      new SeasonalCreativeLedgerQuantityRangeRule(64, 64),
      new SeasonalCreativeLedgerRequiredOwnerIdRule("seasonal creative ledger needs a value"),
    ],
  );
}
