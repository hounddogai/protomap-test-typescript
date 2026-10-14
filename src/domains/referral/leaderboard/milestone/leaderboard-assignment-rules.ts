import * as text from "../../../../kit/text.js";
import { LeaderboardAssignment } from "./leaderboard-assignment.js";

/** A rule a leaderboard assignment must pass. Check returns its problems, or none. */
export interface LeaderboardAssignmentRule {
  check(item: LeaderboardAssignment): string[];
}

export class LeaderboardAssignmentRequiredLabelRule implements LeaderboardAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardAssignment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardAssignmentAllowedTitleRule implements LeaderboardAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LeaderboardAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is stale`];
    return [];
  }
}

export class LeaderboardAssignmentTitleLengthRule implements LeaderboardAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardAssignment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardAssignmentCodeLengthRule implements LeaderboardAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a leaderboard assignment. */
export class LeaderboardAssignmentValidator {
  rules: LeaderboardAssignmentRule[];

  constructor(rules: LeaderboardAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardAssignment): string[] {
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

  requireValid(item: LeaderboardAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardAssignment[]): Map<string, string[]> {
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

export function defaultLeaderboardAssignmentValidator(): LeaderboardAssignmentValidator {
  return new LeaderboardAssignmentValidator(
    [
      new LeaderboardAssignmentRequiredLabelRule("leaderboard assignment needs this field"),
      new LeaderboardAssignmentAllowedTitleRule(["adaptive", "tiered"]),
      new LeaderboardAssignmentTitleLengthRule(255),
      new LeaderboardAssignmentCodeLengthRule(255),
    ],
  );
}
