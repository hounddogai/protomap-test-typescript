import { SeasonalBranchLedger } from "./seasonal-branch-ledger.js";

/** A rule a seasonal branch ledger must pass. Check returns its problems, or none. */
export interface SeasonalBranchLedgerRule {
  check(item: SeasonalBranchLedger): string[];
}

export class SeasonalBranchLedgerCodePrefixRule implements SeasonalBranchLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalBranchLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalBranchLedgerMarginRangeRule implements SeasonalBranchLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalBranchLedger): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalBranchLedgerCodeLengthRule implements SeasonalBranchLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalBranchLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal branch ledger. */
export class SeasonalBranchLedgerValidator {
  rules: SeasonalBranchLedgerRule[];

  constructor(rules: SeasonalBranchLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalBranchLedger): string[] {
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

  requireValid(item: SeasonalBranchLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalBranchLedger[]): Map<string, string[]> {
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

export function defaultSeasonalBranchLedgerValidator(): SeasonalBranchLedgerValidator {
  return new SeasonalBranchLedgerValidator(
    [
      new SeasonalBranchLedgerCodePrefixRule("OPS"),
      new SeasonalBranchLedgerMarginRangeRule(6.7, 1581.8),
      new SeasonalBranchLedgerCodeLengthRule(80),
    ],
  );
}
