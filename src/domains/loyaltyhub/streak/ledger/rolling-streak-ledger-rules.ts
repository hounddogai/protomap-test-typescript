import { RollingStreakLedger } from "./rolling-streak-ledger.js";

/** A rule a rolling streak ledger must pass. Check returns its problems, or none. */
export interface RollingStreakLedgerRule {
  check(item: RollingStreakLedger): string[];
}

export class RollingStreakLedgerSequenceRangeRule implements RollingStreakLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingStreakLedger): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingStreakLedgerFloorValueRangeRule implements RollingStreakLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingStreakLedger): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingStreakLedgerUtmSourceLengthRule implements RollingStreakLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingStreakLedger): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingStreakLedgerRequiredTitleRule implements RollingStreakLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingStreakLedger): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingStreakLedgerRequiredCodeRule implements RollingStreakLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingStreakLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingStreakLedgerTitleLengthRule implements RollingStreakLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingStreakLedger): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling streak ledger. */
export class RollingStreakLedgerValidator {
  rules: RollingStreakLedgerRule[];

  constructor(rules: RollingStreakLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: RollingStreakLedger): string[] {
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

  requireValid(item: RollingStreakLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingStreakLedger[]): Map<string, string[]> {
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

export function defaultRollingStreakLedgerValidator(): RollingStreakLedgerValidator {
  return new RollingStreakLedgerValidator(
    [
      new RollingStreakLedgerSequenceRangeRule(120, 3600),
      new RollingStreakLedgerFloorValueRangeRule(1.4, 2572),
      new RollingStreakLedgerUtmSourceLengthRule(80),
      new RollingStreakLedgerRequiredTitleRule("rolling streak ledger needs an entry"),
      new RollingStreakLedgerRequiredCodeRule("rolling streak ledger needs an entry"),
      new RollingStreakLedgerTitleLengthRule(3600),
    ],
  );
}
