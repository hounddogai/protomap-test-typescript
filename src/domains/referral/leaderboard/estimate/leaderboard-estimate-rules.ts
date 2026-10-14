import * as text from "../../../../kit/text.js";
import { LeaderboardEstimate } from "./leaderboard-estimate.js";

/** A rule a leaderboard estimate must pass. Check returns its problems, or none. */
export interface LeaderboardEstimateRule {
  check(item: LeaderboardEstimate): string[];
}

export class LeaderboardEstimateLabelLengthRule implements LeaderboardEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardEstimate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardEstimateWindowDaysRangeRule implements LeaderboardEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardEstimate): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LeaderboardEstimateTimezoneLengthRule implements LeaderboardEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardEstimate): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardEstimateRequiredCodeRule implements LeaderboardEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardEstimateAllowedCohortRule implements LeaderboardEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LeaderboardEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is above maximum`];
    return [];
  }
}

/** Runs every rule of a leaderboard estimate. */
export class LeaderboardEstimateValidator {
  rules: LeaderboardEstimateRule[];

  constructor(rules: LeaderboardEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LeaderboardEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardEstimate[]): Map<string, string[]> {
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

export function defaultLeaderboardEstimateValidator(): LeaderboardEstimateValidator {
  return new LeaderboardEstimateValidator(
    [
      new LeaderboardEstimateLabelLengthRule(80),
      new LeaderboardEstimateWindowDaysRangeRule(3600, 86400),
      new LeaderboardEstimateTimezoneLengthRule(64),
      new LeaderboardEstimateRequiredCodeRule("leaderboard estimate needs this field"),
      new LeaderboardEstimateAllowedCohortRule(["primary", "strict"]),
    ],
  );
}
