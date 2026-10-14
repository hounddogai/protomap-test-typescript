import { SeasonalPacingLedger } from "./seasonal-pacing-ledger.js";

/** A rule a seasonal pacing ledger must pass. Check returns its problems, or none. */
export interface SeasonalPacingLedgerRule {
  check(item: SeasonalPacingLedger): string[];
}

export class SeasonalPacingLedgerAmountRangeRule implements SeasonalPacingLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalPacingLedger): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalPacingLedgerDescriptionLengthRule implements SeasonalPacingLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalPacingLedger): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalPacingLedgerRequiredCodeRule implements SeasonalPacingLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalPacingLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal pacing ledger. */
export class SeasonalPacingLedgerValidator {
  rules: SeasonalPacingLedgerRule[];

  constructor(rules: SeasonalPacingLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalPacingLedger): string[] {
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

  requireValid(item: SeasonalPacingLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalPacingLedger[]): Map<string, string[]> {
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

export function defaultSeasonalPacingLedgerValidator(): SeasonalPacingLedgerValidator {
  return new SeasonalPacingLedgerValidator(
    [
      new SeasonalPacingLedgerAmountRangeRule(0.7, 891.5),
      new SeasonalPacingLedgerDescriptionLengthRule(120),
      new SeasonalPacingLedgerRequiredCodeRule("seasonal pacing ledger needs an entry"),
    ],
  );
}
