import { LeaderboardPreference } from "./leaderboard-preference.js";

/** A rule a leaderboard preference must pass. Check returns its problems, or none. */
export interface LeaderboardPreferenceRule {
  check(item: LeaderboardPreference): string[];
}

export class LeaderboardPreferenceStartsAtRangeRule implements LeaderboardPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardPreference): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LeaderboardPreferenceRequiredReviewerRule implements LeaderboardPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardPreference): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardPreferenceLabelLengthRule implements LeaderboardPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardPreference): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardPreferenceCostRangeRule implements LeaderboardPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardPreference): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a leaderboard preference. */
export class LeaderboardPreferenceValidator {
  rules: LeaderboardPreferenceRule[];

  constructor(rules: LeaderboardPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardPreference): string[] {
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

  requireValid(item: LeaderboardPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardPreference[]): Map<string, string[]> {
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

export function defaultLeaderboardPreferenceValidator(): LeaderboardPreferenceValidator {
  return new LeaderboardPreferenceValidator(
    [
      new LeaderboardPreferenceStartsAtRangeRule(120, 1000),
      new LeaderboardPreferenceRequiredReviewerRule("leaderboard preference needs this field"),
      new LeaderboardPreferenceLabelLengthRule(16),
      new LeaderboardPreferenceCostRangeRule(2.5, 4890.2),
    ],
  );
}
