import * as text from "../../../../kit/text.js";
import { LeaderboardReservation } from "./leaderboard-reservation.js";

/** A rule a leaderboard reservation must pass. Check returns its problems, or none. */
export interface LeaderboardReservationRule {
  check(item: LeaderboardReservation): string[];
}

export class LeaderboardReservationRequiredNameRule implements LeaderboardReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardReservation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardReservationAllowedUtmSourceRule implements LeaderboardReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LeaderboardReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is missing`];
    return [];
  }
}

export class LeaderboardReservationRevisionRangeRule implements LeaderboardReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardReservation): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LeaderboardReservationCodeLengthRule implements LeaderboardReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardReservationUtmSourceLengthRule implements LeaderboardReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardReservation): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardReservationCreatedAtRangeRule implements LeaderboardReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardReservation): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a leaderboard reservation. */
export class LeaderboardReservationValidator {
  rules: LeaderboardReservationRule[];

  constructor(rules: LeaderboardReservationRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardReservation): string[] {
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

  requireValid(item: LeaderboardReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardReservation[]): Map<string, string[]> {
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

export function defaultLeaderboardReservationValidator(): LeaderboardReservationValidator {
  return new LeaderboardReservationValidator(
    [
      new LeaderboardReservationRequiredNameRule("leaderboard reservation needs a value"),
      new LeaderboardReservationAllowedUtmSourceRule(["rolling", "fallback"]),
      new LeaderboardReservationRevisionRangeRule(120, 3600),
      new LeaderboardReservationCodeLengthRule(80),
      new LeaderboardReservationUtmSourceLengthRule(32),
      new LeaderboardReservationCreatedAtRangeRule(32, 64),
    ],
  );
}
