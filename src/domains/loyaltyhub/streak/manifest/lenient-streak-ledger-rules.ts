import * as text from "../../../../kit/text.js";
import { LenientStreakLedger } from "./lenient-streak-ledger.js";

/** A rule a lenient streak ledger must pass. Check returns its problems, or none. */
export interface LenientStreakLedgerRule {
  check(item: LenientStreakLedger): string[];
}

export class LenientStreakLedgerRequiredCodeRule implements LenientStreakLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientStreakLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientStreakLedgerRequiredOwnerIdRule implements LenientStreakLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientStreakLedger): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class LenientStreakLedgerClicksRangeRule implements LenientStreakLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientStreakLedger): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientStreakLedgerAllowedOwnerIdRule implements LenientStreakLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientStreakLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is too long`];
    return [];
  }
}

export class LenientStreakLedgerCodeLengthRule implements LenientStreakLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientStreakLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientStreakLedgerLocaleLengthRule implements LenientStreakLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientStreakLedger): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient streak ledger. */
export class LenientStreakLedgerValidator {
  rules: LenientStreakLedgerRule[];

  constructor(rules: LenientStreakLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: LenientStreakLedger): string[] {
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

  requireValid(item: LenientStreakLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientStreakLedger[]): Map<string, string[]> {
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

export function defaultLenientStreakLedgerValidator(): LenientStreakLedgerValidator {
  return new LenientStreakLedgerValidator(
    [
      new LenientStreakLedgerRequiredCodeRule("lenient streak ledger needs an entry"),
      new LenientStreakLedgerRequiredOwnerIdRule("lenient streak ledger needs a value"),
      new LenientStreakLedgerClicksRangeRule(16, 1000),
      new LenientStreakLedgerAllowedOwnerIdRule(["lenient", "batched", "tiered"]),
      new LenientStreakLedgerCodeLengthRule(16),
      new LenientStreakLedgerLocaleLengthRule(1000),
    ],
  );
}
