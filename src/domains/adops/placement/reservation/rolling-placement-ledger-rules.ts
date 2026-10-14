import { RollingPlacementLedger } from "./rolling-placement-ledger.js";

/** A rule a rolling placement ledger must pass. Check returns its problems, or none. */
export interface RollingPlacementLedgerRule {
  check(item: RollingPlacementLedger): string[];
}

export class RollingPlacementLedgerCapacityRangeRule implements RollingPlacementLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingPlacementLedger): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingPlacementLedgerDiscountRangeRule implements RollingPlacementLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingPlacementLedger): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingPlacementLedgerNameLengthRule implements RollingPlacementLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPlacementLedger): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling placement ledger. */
export class RollingPlacementLedgerValidator {
  rules: RollingPlacementLedgerRule[];

  constructor(rules: RollingPlacementLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPlacementLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingPlacementLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPlacementLedger[]): Map<string, string[]> {
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

export function defaultRollingPlacementLedgerValidator(): RollingPlacementLedgerValidator {
  return new RollingPlacementLedgerValidator(
    [
      new RollingPlacementLedgerCapacityRangeRule(255, 3600),
      new RollingPlacementLedgerDiscountRangeRule(8.2, 3302.3),
      new RollingPlacementLedgerNameLengthRule(1000),
    ],
  );
}
