import { LeaderboardMapping } from "./leaderboard-mapping.js";

/** A rule a leaderboard mapping must pass. Check returns its problems, or none. */
export interface LeaderboardMappingRule {
  check(item: LeaderboardMapping): string[];
}

export class LeaderboardMappingAudienceIdLengthRule implements LeaderboardMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardMapping): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardMappingClicksRangeRule implements LeaderboardMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardMapping): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LeaderboardMappingRequiredNameRule implements LeaderboardMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardMapping): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardMappingRequiredAudienceIdRule implements LeaderboardMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardMapping): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a leaderboard mapping. */
export class LeaderboardMappingValidator {
  rules: LeaderboardMappingRule[];

  constructor(rules: LeaderboardMappingRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardMapping): string[] {
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

  requireValid(item: LeaderboardMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardMapping[]): Map<string, string[]> {
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

export function defaultLeaderboardMappingValidator(): LeaderboardMappingValidator {
  return new LeaderboardMappingValidator(
    [
      new LeaderboardMappingAudienceIdLengthRule(80),
      new LeaderboardMappingClicksRangeRule(64, 1000),
      new LeaderboardMappingRequiredNameRule("leaderboard mapping needs a value"),
      new LeaderboardMappingRequiredAudienceIdRule("leaderboard mapping needs a value"),
    ],
  );
}
