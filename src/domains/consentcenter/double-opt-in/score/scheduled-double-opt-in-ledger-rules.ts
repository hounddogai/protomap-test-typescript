import { ScheduledDoubleOptInLedger } from "./scheduled-double-opt-in-ledger.js";

/** A rule a scheduled double opt in ledger must pass. Check returns its problems, or none. */
export interface ScheduledDoubleOptInLedgerRule {
  check(item: ScheduledDoubleOptInLedger): string[];
}

export class ScheduledDoubleOptInLedgerDurationMinutesRangeRule implements ScheduledDoubleOptInLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledDoubleOptInLedger): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledDoubleOptInLedgerRequiredCodeRule implements ScheduledDoubleOptInLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledDoubleOptInLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledDoubleOptInLedgerCodeLengthRule implements ScheduledDoubleOptInLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDoubleOptInLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled double opt in ledger. */
export class ScheduledDoubleOptInLedgerValidator {
  rules: ScheduledDoubleOptInLedgerRule[];

  constructor(rules: ScheduledDoubleOptInLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledDoubleOptInLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledDoubleOptInLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledDoubleOptInLedger[]): Map<string, string[]> {
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

export function defaultScheduledDoubleOptInLedgerValidator(): ScheduledDoubleOptInLedgerValidator {
  return new ScheduledDoubleOptInLedgerValidator(
    [
      new ScheduledDoubleOptInLedgerDurationMinutesRangeRule(120, 86400),
      new ScheduledDoubleOptInLedgerRequiredCodeRule("scheduled double opt in ledger needs this field"),
      new ScheduledDoubleOptInLedgerCodeLengthRule(86400),
    ],
  );
}
