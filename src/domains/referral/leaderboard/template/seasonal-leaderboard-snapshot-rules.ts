import { SeasonalLeaderboardSnapshot } from "./seasonal-leaderboard-snapshot.js";

/** A rule a seasonal leaderboard snapshot must pass. Check returns its problems, or none. */
export interface SeasonalLeaderboardSnapshotRule {
  check(item: SeasonalLeaderboardSnapshot): string[];
}

export class SeasonalLeaderboardSnapshotExternalRefLengthRule implements SeasonalLeaderboardSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalLeaderboardSnapshot): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalLeaderboardSnapshotRequiredTimezoneRule implements SeasonalLeaderboardSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalLeaderboardSnapshot): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalLeaderboardSnapshotCeilingRangeRule implements SeasonalLeaderboardSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalLeaderboardSnapshot): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalLeaderboardSnapshotTitleLengthRule implements SeasonalLeaderboardSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalLeaderboardSnapshot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal leaderboard snapshot. */
export class SeasonalLeaderboardSnapshotValidator {
  rules: SeasonalLeaderboardSnapshotRule[];

  constructor(rules: SeasonalLeaderboardSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalLeaderboardSnapshot): string[] {
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

  requireValid(item: SeasonalLeaderboardSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalLeaderboardSnapshot[]): Map<string, string[]> {
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

export function defaultSeasonalLeaderboardSnapshotValidator(): SeasonalLeaderboardSnapshotValidator {
  return new SeasonalLeaderboardSnapshotValidator(
    [
      new SeasonalLeaderboardSnapshotExternalRefLengthRule(80),
      new SeasonalLeaderboardSnapshotRequiredTimezoneRule("seasonal leaderboard snapshot needs this field"),
      new SeasonalLeaderboardSnapshotCeilingRangeRule(4.7, 2087.4),
      new SeasonalLeaderboardSnapshotTitleLengthRule(120),
    ],
  );
}
