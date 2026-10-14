import * as text from "../../../../kit/text.js";
import { LeaderboardCycle } from "./leaderboard-cycle.js";

/** A rule a leaderboard cycle must pass. Check returns its problems, or none. */
export interface LeaderboardCycleRule {
  check(item: LeaderboardCycle): string[];
}

export class LeaderboardCycleBidRangeRule implements LeaderboardCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardCycle): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LeaderboardCycleRequiredTitleRule implements LeaderboardCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardCycle): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardCycleAllowedCodeRule implements LeaderboardCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LeaderboardCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

/** Runs every rule of a leaderboard cycle. */
export class LeaderboardCycleValidator {
  rules: LeaderboardCycleRule[];

  constructor(rules: LeaderboardCycleRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LeaderboardCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardCycle[]): Map<string, string[]> {
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

export function defaultLeaderboardCycleValidator(): LeaderboardCycleValidator {
  return new LeaderboardCycleValidator(
    [
      new LeaderboardCycleBidRangeRule(8.2, 3186),
      new LeaderboardCycleRequiredTitleRule("leaderboard cycle needs an entry"),
      new LeaderboardCycleAllowedCodeRule(["seasonal", "global"]),
    ],
  );
}
