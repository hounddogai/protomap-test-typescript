import { LeaderboardNotice } from "./leaderboard-notice.js";

/** A rule a leaderboard notice must pass. Check returns its problems, or none. */
export interface LeaderboardNoticeRule {
  check(item: LeaderboardNotice): string[];
}

export class LeaderboardNoticeRequiredLabelRule implements LeaderboardNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardNotice): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardNoticeSendAtRangeRule implements LeaderboardNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardNotice): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LeaderboardNoticeRequiredCodeRule implements LeaderboardNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardNoticeLabelLengthRule implements LeaderboardNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardNotice): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardNoticeRequiredCampaignRefRule implements LeaderboardNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardNotice): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardNoticeBudgetRangeRule implements LeaderboardNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardNotice): string[] {
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

/** Runs every rule of a leaderboard notice. */
export class LeaderboardNoticeValidator {
  rules: LeaderboardNoticeRule[];

  constructor(rules: LeaderboardNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LeaderboardNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardNotice[]): Map<string, string[]> {
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

export function defaultLeaderboardNoticeValidator(): LeaderboardNoticeValidator {
  return new LeaderboardNoticeValidator(
    [
      new LeaderboardNoticeRequiredLabelRule("leaderboard notice needs a value"),
      new LeaderboardNoticeSendAtRangeRule(16, 120),
      new LeaderboardNoticeRequiredCodeRule("leaderboard notice needs this field"),
      new LeaderboardNoticeLabelLengthRule(86400),
      new LeaderboardNoticeRequiredCampaignRefRule("leaderboard notice needs an entry"),
      new LeaderboardNoticeBudgetRangeRule(10, 4722.4),
    ],
  );
}
