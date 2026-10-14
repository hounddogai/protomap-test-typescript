import { LeaderboardSegment } from "./leaderboard-segment.js";

/** A rule a leaderboard segment must pass. Check returns its problems, or none. */
export interface LeaderboardSegmentRule {
  check(item: LeaderboardSegment): string[];
}

export class LeaderboardSegmentArchivedGuardRule implements LeaderboardSegmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LeaderboardSegment): string[] {
    if (item.archived && item.durationMinutes > this.limit) return [`duration minutes ${item.durationMinutes} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class LeaderboardSegmentRequiredCodeRule implements LeaderboardSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardSegmentCategoryLengthRule implements LeaderboardSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardSegment): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardSegmentConversionRateRangeRule implements LeaderboardSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardSegment): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a leaderboard segment. */
export class LeaderboardSegmentValidator {
  rules: LeaderboardSegmentRule[];

  constructor(rules: LeaderboardSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardSegment): string[] {
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

  requireValid(item: LeaderboardSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardSegment[]): Map<string, string[]> {
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

export function defaultLeaderboardSegmentValidator(): LeaderboardSegmentValidator {
  return new LeaderboardSegmentValidator(
    [
      new LeaderboardSegmentArchivedGuardRule(120),
      new LeaderboardSegmentRequiredCodeRule("leaderboard segment needs an entry"),
      new LeaderboardSegmentCategoryLengthRule(1000),
      new LeaderboardSegmentConversionRateRangeRule(4.2, 762),
    ],
  );
}
