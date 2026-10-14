import * as text from "../../../../kit/text.js";
import { LeaderboardDigest } from "./leaderboard-digest.js";

/** A rule a leaderboard digest must pass. Check returns its problems, or none. */
export interface LeaderboardDigestRule {
  check(item: LeaderboardDigest): string[];
}

export class LeaderboardDigestAllowedSegmentRule implements LeaderboardDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LeaderboardDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is above maximum`];
    return [];
  }
}

export class LeaderboardDigestRequiredNameRule implements LeaderboardDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardDigest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardDigestCodeLengthRule implements LeaderboardDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardDigestRequiredCodeRule implements LeaderboardDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a leaderboard digest. */
export class LeaderboardDigestValidator {
  rules: LeaderboardDigestRule[];

  constructor(rules: LeaderboardDigestRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardDigest): string[] {
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

  requireValid(item: LeaderboardDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardDigest[]): Map<string, string[]> {
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

export function defaultLeaderboardDigestValidator(): LeaderboardDigestValidator {
  return new LeaderboardDigestValidator(
    [
      new LeaderboardDigestAllowedSegmentRule(["pending", "lenient", "capped"]),
      new LeaderboardDigestRequiredNameRule("leaderboard digest needs this field"),
      new LeaderboardDigestCodeLengthRule(1000),
      new LeaderboardDigestRequiredCodeRule("leaderboard digest needs an entry"),
    ],
  );
}
