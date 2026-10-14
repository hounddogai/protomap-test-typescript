import { NudgeLedger } from "./nudge-ledger.js";

/** A rule a nudge ledger must pass. Check returns its problems, or none. */
export interface NudgeLedgerRule {
  check(item: NudgeLedger): string[];
}

export class NudgeLedgerTitleLengthRule implements NudgeLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeLedger): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeLedgerWeightRangeRule implements NudgeLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeLedger): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class NudgeLedgerRevisionRangeRule implements NudgeLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeLedger): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class NudgeLedgerEndsAtRangeRule implements NudgeLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeLedger): string[] {
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

/** Runs every rule of a nudge ledger. */
export class NudgeLedgerValidator {
  rules: NudgeLedgerRule[];

  constructor(rules: NudgeLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeLedger): string[] {
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

  requireValid(item: NudgeLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeLedger[]): Map<string, string[]> {
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

export function defaultNudgeLedgerValidator(): NudgeLedgerValidator {
  return new NudgeLedgerValidator(
    [
      new NudgeLedgerTitleLengthRule(120),
      new NudgeLedgerWeightRangeRule(0.9, 3732.5),
      new NudgeLedgerRevisionRangeRule(16, 3600),
      new NudgeLedgerEndsAtRangeRule(120, 1000),
    ],
  );
}
