import { LeaderboardTarget } from "./leaderboard-target.js";

/** A rule a leaderboard target must pass. Check returns its problems, or none. */
export interface LeaderboardTargetRule {
  check(item: LeaderboardTarget): string[];
}

export class LeaderboardTargetGraceDaysRangeRule implements LeaderboardTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardTarget): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LeaderboardTargetLabelLengthRule implements LeaderboardTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardTarget): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardTargetLocaleLengthRule implements LeaderboardTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardTarget): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardTargetRequiredDescriptionRule implements LeaderboardTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardTarget): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a leaderboard target. */
export class LeaderboardTargetValidator {
  rules: LeaderboardTargetRule[];

  constructor(rules: LeaderboardTargetRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LeaderboardTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardTarget[]): Map<string, string[]> {
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

export function defaultLeaderboardTargetValidator(): LeaderboardTargetValidator {
  return new LeaderboardTargetValidator(
    [
      new LeaderboardTargetGraceDaysRangeRule(16, 32),
      new LeaderboardTargetLabelLengthRule(3600),
      new LeaderboardTargetLocaleLengthRule(86400),
      new LeaderboardTargetRequiredDescriptionRule("leaderboard target needs a value"),
    ],
  );
}
