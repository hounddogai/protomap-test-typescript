import { LeaderboardSchedule } from "./leaderboard-schedule.js";

/** A rule a leaderboard schedule must pass. Check returns its problems, or none. */
export interface LeaderboardScheduleRule {
  check(item: LeaderboardSchedule): string[];
}

export class LeaderboardScheduleCodeLengthRule implements LeaderboardScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardScheduleRequiredCampaignRefRule implements LeaderboardScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardSchedule): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardScheduleBidRangeRule implements LeaderboardScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardSchedule): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a leaderboard schedule. */
export class LeaderboardScheduleValidator {
  rules: LeaderboardScheduleRule[];

  constructor(rules: LeaderboardScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardSchedule): string[] {
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

  requireValid(item: LeaderboardSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardSchedule[]): Map<string, string[]> {
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

export function defaultLeaderboardScheduleValidator(): LeaderboardScheduleValidator {
  return new LeaderboardScheduleValidator(
    [
      new LeaderboardScheduleCodeLengthRule(64),
      new LeaderboardScheduleRequiredCampaignRefRule("leaderboard schedule needs a value"),
      new LeaderboardScheduleBidRangeRule(0.2, 2316),
    ],
  );
}
