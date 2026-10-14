import * as text from "../../../../kit/text.js";
import { LeaderboardLedger } from "./leaderboard-ledger.js";

/** A rule a leaderboard ledger must pass. Check returns its problems, or none. */
export interface LeaderboardLedgerRule {
  check(item: LeaderboardLedger): string[];
}

export class LeaderboardLedgerCreatedAtRangeRule implements LeaderboardLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardLedger): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LeaderboardLedgerSummaryLengthRule implements LeaderboardLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardLedger): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardLedgerDescriptionLengthRule implements LeaderboardLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardLedger): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardLedgerAllowedPhoneRule implements LeaderboardLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LeaderboardLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is above maximum`];
    return [];
  }
}

/** Runs every rule of a leaderboard ledger. */
export class LeaderboardLedgerValidator {
  rules: LeaderboardLedgerRule[];

  constructor(rules: LeaderboardLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardLedger): string[] {
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

  requireValid(item: LeaderboardLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardLedger[]): Map<string, string[]> {
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

export function defaultLeaderboardLedgerValidator(): LeaderboardLedgerValidator {
  return new LeaderboardLedgerValidator(
    [
      new LeaderboardLedgerCreatedAtRangeRule(3600, 86400),
      new LeaderboardLedgerSummaryLengthRule(16),
      new LeaderboardLedgerDescriptionLengthRule(86400),
      new LeaderboardLedgerAllowedPhoneRule(["regional", "seasonal"]),
    ],
  );
}
