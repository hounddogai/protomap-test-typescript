import { WeightedOptOutLedger } from "./weighted-opt-out-ledger.js";

/** A rule a weighted opt out ledger must pass. Check returns its problems, or none. */
export interface WeightedOptOutLedgerRule {
  check(item: WeightedOptOutLedger): string[];
}

export class WeightedOptOutLedgerDurationMinutesRangeRule implements WeightedOptOutLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedOptOutLedger): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedOptOutLedgerRequiredTitleRule implements WeightedOptOutLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedOptOutLedger): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedOptOutLedgerRequiredCurrencyRule implements WeightedOptOutLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedOptOutLedger): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted opt out ledger. */
export class WeightedOptOutLedgerValidator {
  rules: WeightedOptOutLedgerRule[];

  constructor(rules: WeightedOptOutLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedOptOutLedger): string[] {
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

  requireValid(item: WeightedOptOutLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedOptOutLedger[]): Map<string, string[]> {
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

export function defaultWeightedOptOutLedgerValidator(): WeightedOptOutLedgerValidator {
  return new WeightedOptOutLedgerValidator(
    [
      new WeightedOptOutLedgerDurationMinutesRangeRule(32, 80),
      new WeightedOptOutLedgerRequiredTitleRule("weighted opt out ledger needs this field"),
      new WeightedOptOutLedgerRequiredCurrencyRule("weighted opt out ledger needs this field"),
    ],
  );
}
