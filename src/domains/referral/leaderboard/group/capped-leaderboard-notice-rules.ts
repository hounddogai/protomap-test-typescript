import { CappedLeaderboardNotice } from "./capped-leaderboard-notice.js";

/** A rule a capped leaderboard notice must pass. Check returns its problems, or none. */
export interface CappedLeaderboardNoticeRule {
  check(item: CappedLeaderboardNotice): string[];
}

export class CappedLeaderboardNoticeVersionRangeRule implements CappedLeaderboardNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedLeaderboardNotice): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedLeaderboardNoticeBudgetRangeRule implements CappedLeaderboardNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedLeaderboardNotice): string[] {
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

export class CappedLeaderboardNoticeRequiredCodeRule implements CappedLeaderboardNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedLeaderboardNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedLeaderboardNoticeCodeLengthRule implements CappedLeaderboardNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedLeaderboardNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped leaderboard notice. */
export class CappedLeaderboardNoticeValidator {
  rules: CappedLeaderboardNoticeRule[];

  constructor(rules: CappedLeaderboardNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: CappedLeaderboardNotice): string[] {
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

  requireValid(item: CappedLeaderboardNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedLeaderboardNotice[]): Map<string, string[]> {
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

export function defaultCappedLeaderboardNoticeValidator(): CappedLeaderboardNoticeValidator {
  return new CappedLeaderboardNoticeValidator(
    [
      new CappedLeaderboardNoticeVersionRangeRule(32, 64),
      new CappedLeaderboardNoticeBudgetRangeRule(6.7, 1097.8),
      new CappedLeaderboardNoticeRequiredCodeRule("capped leaderboard notice needs a value"),
      new CappedLeaderboardNoticeCodeLengthRule(120),
    ],
  );
}
