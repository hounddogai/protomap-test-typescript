import * as text from "../../../../kit/text.js";
import { LeaderboardBaseline } from "./leaderboard-baseline.js";

/** A rule a leaderboard baseline must pass. Check returns its problems, or none. */
export interface LeaderboardBaselineRule {
  check(item: LeaderboardBaseline): string[];
}

export class LeaderboardBaselineCodePrefixRule implements LeaderboardBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LeaderboardBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LeaderboardBaselineAllowedAudienceIdRule implements LeaderboardBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LeaderboardBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is not allowed`];
    return [];
  }
}

export class LeaderboardBaselineCodeLengthRule implements LeaderboardBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardBaselineRequiredCohortRule implements LeaderboardBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardBaseline): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a leaderboard baseline. */
export class LeaderboardBaselineValidator {
  rules: LeaderboardBaselineRule[];

  constructor(rules: LeaderboardBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardBaseline): string[] {
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

  requireValid(item: LeaderboardBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardBaseline[]): Map<string, string[]> {
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

export function defaultLeaderboardBaselineValidator(): LeaderboardBaselineValidator {
  return new LeaderboardBaselineValidator(
    [
      new LeaderboardBaselineCodePrefixRule("X"),
      new LeaderboardBaselineAllowedAudienceIdRule(["legacy"]),
      new LeaderboardBaselineCodeLengthRule(86400),
      new LeaderboardBaselineRequiredCohortRule("leaderboard baseline needs a value"),
    ],
  );
}
