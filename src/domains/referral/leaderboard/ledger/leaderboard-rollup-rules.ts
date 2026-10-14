import { LeaderboardRollup } from "./leaderboard-rollup.js";

/** A rule a leaderboard rollup must pass. Check returns its problems, or none. */
export interface LeaderboardRollupRule {
  check(item: LeaderboardRollup): string[];
}

export class LeaderboardRollupTitleLengthRule implements LeaderboardRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardRollup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardRollupRequiredSegmentRule implements LeaderboardRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardRollup): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardRollupCodeLengthRule implements LeaderboardRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a leaderboard rollup. */
export class LeaderboardRollupValidator {
  rules: LeaderboardRollupRule[];

  constructor(rules: LeaderboardRollupRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardRollup): string[] {
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

  requireValid(item: LeaderboardRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardRollup[]): Map<string, string[]> {
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

export function defaultLeaderboardRollupValidator(): LeaderboardRollupValidator {
  return new LeaderboardRollupValidator(
    [
      new LeaderboardRollupTitleLengthRule(120),
      new LeaderboardRollupRequiredSegmentRule("leaderboard rollup needs a value"),
      new LeaderboardRollupCodeLengthRule(3600),
    ],
  );
}
