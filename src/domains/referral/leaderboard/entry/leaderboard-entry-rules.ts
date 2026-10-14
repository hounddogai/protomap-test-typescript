import { LeaderboardEntry } from "./leaderboard-entry.js";

/** A rule a leaderboard entry must pass. Check returns its problems, or none. */
export interface LeaderboardEntryRule {
  check(item: LeaderboardEntry): string[];
}

export class LeaderboardEntryLabelLengthRule implements LeaderboardEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardEntry): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardEntryRequiredCodeRule implements LeaderboardEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardEntryRequiredSourceRule implements LeaderboardEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardEntry): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardEntryReviewerLengthRule implements LeaderboardEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardEntry): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a leaderboard entry. */
export class LeaderboardEntryValidator {
  rules: LeaderboardEntryRule[];

  constructor(rules: LeaderboardEntryRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardEntry): string[] {
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

  requireValid(item: LeaderboardEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardEntry[]): Map<string, string[]> {
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

export function defaultLeaderboardEntryValidator(): LeaderboardEntryValidator {
  return new LeaderboardEntryValidator(
    [
      new LeaderboardEntryLabelLengthRule(120),
      new LeaderboardEntryRequiredCodeRule("leaderboard entry needs a value"),
      new LeaderboardEntryRequiredSourceRule("leaderboard entry needs an entry"),
      new LeaderboardEntryReviewerLengthRule(3600),
    ],
  );
}
