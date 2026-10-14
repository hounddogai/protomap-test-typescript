import { SeasonalLeaderboardRollup } from "./seasonal-leaderboard-rollup.js";

/** A rule a seasonal leaderboard rollup must pass. Check returns its problems, or none. */
export interface SeasonalLeaderboardRollupRule {
  check(item: SeasonalLeaderboardRollup): string[];
}

export class SeasonalLeaderboardRollupTimezoneLengthRule implements SeasonalLeaderboardRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalLeaderboardRollup): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalLeaderboardRollupRequiredTitleRule implements SeasonalLeaderboardRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalLeaderboardRollup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalLeaderboardRollupRequiredTimezoneRule implements SeasonalLeaderboardRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalLeaderboardRollup): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalLeaderboardRollupRequiredCountryRule implements SeasonalLeaderboardRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalLeaderboardRollup): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal leaderboard rollup. */
export class SeasonalLeaderboardRollupValidator {
  rules: SeasonalLeaderboardRollupRule[];

  constructor(rules: SeasonalLeaderboardRollupRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalLeaderboardRollup): string[] {
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

  requireValid(item: SeasonalLeaderboardRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalLeaderboardRollup[]): Map<string, string[]> {
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

export function defaultSeasonalLeaderboardRollupValidator(): SeasonalLeaderboardRollupValidator {
  return new SeasonalLeaderboardRollupValidator(
    [
      new SeasonalLeaderboardRollupTimezoneLengthRule(16),
      new SeasonalLeaderboardRollupRequiredTitleRule("seasonal leaderboard rollup needs this field"),
      new SeasonalLeaderboardRollupRequiredTimezoneRule("seasonal leaderboard rollup needs this field"),
      new SeasonalLeaderboardRollupRequiredCountryRule("seasonal leaderboard rollup needs this field"),
    ],
  );
}
