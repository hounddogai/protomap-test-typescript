import { LeaderboardDraft } from "./leaderboard-draft.js";

/** A rule a leaderboard draft must pass. Check returns its problems, or none. */
export interface LeaderboardDraftRule {
  check(item: LeaderboardDraft): string[];
}

export class LeaderboardDraftRequiredCodeRule implements LeaderboardDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardDraftLocaleLengthRule implements LeaderboardDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardDraft): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardDraftLabelLengthRule implements LeaderboardDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardDraft): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardDraftThresholdRangeRule implements LeaderboardDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardDraft): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LeaderboardDraftRequiredTitleRule implements LeaderboardDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardDraft): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a leaderboard draft. */
export class LeaderboardDraftValidator {
  rules: LeaderboardDraftRule[];

  constructor(rules: LeaderboardDraftRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardDraft): string[] {
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

  requireValid(item: LeaderboardDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardDraft[]): Map<string, string[]> {
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

export function defaultLeaderboardDraftValidator(): LeaderboardDraftValidator {
  return new LeaderboardDraftValidator(
    [
      new LeaderboardDraftRequiredCodeRule("leaderboard draft needs a value"),
      new LeaderboardDraftLocaleLengthRule(64),
      new LeaderboardDraftLabelLengthRule(80),
      new LeaderboardDraftThresholdRangeRule(6.7, 2757.1),
      new LeaderboardDraftRequiredTitleRule("leaderboard draft needs an entry"),
    ],
  );
}
