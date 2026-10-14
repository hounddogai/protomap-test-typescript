import { LeaderboardMilestone } from "./leaderboard-milestone.js";

/** A rule a leaderboard milestone must pass. Check returns its problems, or none. */
export interface LeaderboardMilestoneRule {
  check(item: LeaderboardMilestone): string[];
}

export class LeaderboardMilestoneRequiredCodeRule implements LeaderboardMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardMilestoneLabelLengthRule implements LeaderboardMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardMilestone): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardMilestoneSummaryLengthRule implements LeaderboardMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardMilestone): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardMilestoneRequiredSummaryRule implements LeaderboardMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardMilestone): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardMilestoneOpenRateRangeRule implements LeaderboardMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardMilestone): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LeaderboardMilestoneCodeLengthRule implements LeaderboardMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a leaderboard milestone. */
export class LeaderboardMilestoneValidator {
  rules: LeaderboardMilestoneRule[];

  constructor(rules: LeaderboardMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardMilestone): string[] {
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

  requireValid(item: LeaderboardMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardMilestone[]): Map<string, string[]> {
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

export function defaultLeaderboardMilestoneValidator(): LeaderboardMilestoneValidator {
  return new LeaderboardMilestoneValidator(
    [
      new LeaderboardMilestoneRequiredCodeRule("leaderboard milestone needs a value"),
      new LeaderboardMilestoneLabelLengthRule(32),
      new LeaderboardMilestoneSummaryLengthRule(255),
      new LeaderboardMilestoneRequiredSummaryRule("leaderboard milestone needs a value"),
      new LeaderboardMilestoneOpenRateRangeRule(3, 2371.1),
      new LeaderboardMilestoneCodeLengthRule(32),
    ],
  );
}
