import { LeaderboardSnapshot } from "./leaderboard-snapshot.js";

/** A rule a leaderboard snapshot must pass. Check returns its problems, or none. */
export interface LeaderboardSnapshotRule {
  check(item: LeaderboardSnapshot): string[];
}

export class LeaderboardSnapshotCodePrefixRule implements LeaderboardSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LeaderboardSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LeaderboardSnapshotPriorityRangeRule implements LeaderboardSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardSnapshot): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LeaderboardSnapshotCampaignRefLengthRule implements LeaderboardSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardSnapshot): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a leaderboard snapshot. */
export class LeaderboardSnapshotValidator {
  rules: LeaderboardSnapshotRule[];

  constructor(rules: LeaderboardSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardSnapshot): string[] {
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

  requireValid(item: LeaderboardSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardSnapshot[]): Map<string, string[]> {
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

export function defaultLeaderboardSnapshotValidator(): LeaderboardSnapshotValidator {
  return new LeaderboardSnapshotValidator(
    [
      new LeaderboardSnapshotCodePrefixRule("REF"),
      new LeaderboardSnapshotPriorityRangeRule(16, 86400),
      new LeaderboardSnapshotCampaignRefLengthRule(80),
    ],
  );
}
