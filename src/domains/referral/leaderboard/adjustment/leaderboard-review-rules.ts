import { LeaderboardReview } from "./leaderboard-review.js";

/** A rule a leaderboard review must pass. Check returns its problems, or none. */
export interface LeaderboardReviewRule {
  check(item: LeaderboardReview): string[];
}

export class LeaderboardReviewCostRangeRule implements LeaderboardReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardReview): string[] {
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

export class LeaderboardReviewRequiredCodeRule implements LeaderboardReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardReviewBudgetRangeRule implements LeaderboardReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardReview): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a leaderboard review. */
export class LeaderboardReviewValidator {
  rules: LeaderboardReviewRule[];

  constructor(rules: LeaderboardReviewRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LeaderboardReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardReview[]): Map<string, string[]> {
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

export function defaultLeaderboardReviewValidator(): LeaderboardReviewValidator {
  return new LeaderboardReviewValidator(
    [
      new LeaderboardReviewCostRangeRule(2.7, 4549.9),
      new LeaderboardReviewRequiredCodeRule("leaderboard review needs a value"),
      new LeaderboardReviewBudgetRangeRule(7.3, 3187.9),
    ],
  );
}
