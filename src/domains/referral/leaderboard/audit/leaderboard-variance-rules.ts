import { LeaderboardVariance } from "./leaderboard-variance.js";

/** A rule a leaderboard variance must pass. Check returns its problems, or none. */
export interface LeaderboardVarianceRule {
  check(item: LeaderboardVariance): string[];
}

export class LeaderboardVarianceRateRangeRule implements LeaderboardVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardVariance): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LeaderboardVarianceRequiredCodeRule implements LeaderboardVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardVarianceApprovedGuardRule implements LeaderboardVarianceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LeaderboardVariance): string[] {
    if (item.approved && item.updatedAt > this.limit) return [`updated at ${item.updatedAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class LeaderboardVarianceUpdatedAtRangeRule implements LeaderboardVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardVariance): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a leaderboard variance. */
export class LeaderboardVarianceValidator {
  rules: LeaderboardVarianceRule[];

  constructor(rules: LeaderboardVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardVariance): string[] {
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

  requireValid(item: LeaderboardVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardVariance[]): Map<string, string[]> {
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

export function defaultLeaderboardVarianceValidator(): LeaderboardVarianceValidator {
  return new LeaderboardVarianceValidator(
    [
      new LeaderboardVarianceRateRangeRule(9.2, 471.3),
      new LeaderboardVarianceRequiredCodeRule("leaderboard variance needs an entry"),
      new LeaderboardVarianceApprovedGuardRule(1000),
      new LeaderboardVarianceUpdatedAtRangeRule(64, 255),
    ],
  );
}
