import { CappedPayoutSchedule } from "./capped-payout-schedule.js";

/** A rule a capped payout schedule must pass. Check returns its problems, or none. */
export interface CappedPayoutScheduleRule {
  check(item: CappedPayoutSchedule): string[];
}

export class CappedPayoutScheduleNotesLengthRule implements CappedPayoutScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedPayoutSchedule): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedPayoutScheduleCodeLengthRule implements CappedPayoutScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedPayoutSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedPayoutScheduleStartsAtRangeRule implements CappedPayoutScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedPayoutSchedule): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a capped payout schedule. */
export class CappedPayoutScheduleValidator {
  rules: CappedPayoutScheduleRule[];

  constructor(rules: CappedPayoutScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: CappedPayoutSchedule): string[] {
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

  requireValid(item: CappedPayoutSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedPayoutSchedule[]): Map<string, string[]> {
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

export function defaultCappedPayoutScheduleValidator(): CappedPayoutScheduleValidator {
  return new CappedPayoutScheduleValidator(
    [
      new CappedPayoutScheduleNotesLengthRule(86400),
      new CappedPayoutScheduleCodeLengthRule(64),
      new CappedPayoutScheduleStartsAtRangeRule(16, 1000),
    ],
  );
}
