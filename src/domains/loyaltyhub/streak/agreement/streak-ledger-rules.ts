import { StreakLedger } from "./streak-ledger.js";

/** A rule a streak ledger must pass. Check returns its problems, or none. */
export interface StreakLedgerRule {
  check(item: StreakLedger): string[];
}

export class StreakLedgerTitleLengthRule implements StreakLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakLedger): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakLedgerEndsAtRangeRule implements StreakLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakLedger): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StreakLedgerRequiredCohortRule implements StreakLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakLedger): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class StreakLedgerWeightRangeRule implements StreakLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakLedger): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StreakLedgerRequiredUtmSourceRule implements StreakLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakLedger): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a streak ledger. */
export class StreakLedgerValidator {
  rules: StreakLedgerRule[];

  constructor(rules: StreakLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: StreakLedger): string[] {
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

  requireValid(item: StreakLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakLedger[]): Map<string, string[]> {
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

export function defaultStreakLedgerValidator(): StreakLedgerValidator {
  return new StreakLedgerValidator(
    [
      new StreakLedgerTitleLengthRule(3600),
      new StreakLedgerEndsAtRangeRule(80, 80),
      new StreakLedgerRequiredCohortRule("streak ledger needs a value"),
      new StreakLedgerWeightRangeRule(8.5, 2663.9),
      new StreakLedgerRequiredUtmSourceRule("streak ledger needs this field"),
    ],
  );
}
