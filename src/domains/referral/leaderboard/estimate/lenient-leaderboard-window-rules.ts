import { LenientLeaderboardWindow } from "./lenient-leaderboard-window.js";

/** A rule a lenient leaderboard window must pass. Check returns its problems, or none. */
export interface LenientLeaderboardWindowRule {
  check(item: LenientLeaderboardWindow): string[];
}

export class LenientLeaderboardWindowClicksRangeRule implements LenientLeaderboardWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientLeaderboardWindow): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientLeaderboardWindowExpiresAtRangeRule implements LenientLeaderboardWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientLeaderboardWindow): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientLeaderboardWindowLabelLengthRule implements LenientLeaderboardWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientLeaderboardWindow): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient leaderboard window. */
export class LenientLeaderboardWindowValidator {
  rules: LenientLeaderboardWindowRule[];

  constructor(rules: LenientLeaderboardWindowRule[]) {
    this.rules = rules;
  }

  validate(item: LenientLeaderboardWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientLeaderboardWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientLeaderboardWindow[]): Map<string, string[]> {
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

export function defaultLenientLeaderboardWindowValidator(): LenientLeaderboardWindowValidator {
  return new LenientLeaderboardWindowValidator(
    [
      new LenientLeaderboardWindowClicksRangeRule(80, 1000),
      new LenientLeaderboardWindowExpiresAtRangeRule(32, 255),
      new LenientLeaderboardWindowLabelLengthRule(80),
    ],
  );
}
