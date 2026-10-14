import * as text from "../../../../kit/text.js";
import { DoubleOptInLedger } from "./double-opt-in-ledger.js";

/** A rule a double opt in ledger must pass. Check returns its problems, or none. */
export interface DoubleOptInLedgerRule {
  check(item: DoubleOptInLedger): string[];
}

export class DoubleOptInLedgerAllowedLocaleRule implements DoubleOptInLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DoubleOptInLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is blocked`];
    return [];
  }
}

export class DoubleOptInLedgerStartsAtRangeRule implements DoubleOptInLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInLedger): string[] {
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

export class DoubleOptInLedgerContactEmailLengthRule implements DoubleOptInLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInLedger): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a double opt in ledger. */
export class DoubleOptInLedgerValidator {
  rules: DoubleOptInLedgerRule[];

  constructor(rules: DoubleOptInLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DoubleOptInLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInLedger[]): Map<string, string[]> {
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

export function defaultDoubleOptInLedgerValidator(): DoubleOptInLedgerValidator {
  return new DoubleOptInLedgerValidator(
    [
      new DoubleOptInLedgerAllowedLocaleRule(["adaptive"]),
      new DoubleOptInLedgerStartsAtRangeRule(32, 255),
      new DoubleOptInLedgerContactEmailLengthRule(3600),
    ],
  );
}
