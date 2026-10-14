import { PendingLeaderboardSummary } from "./pending-leaderboard-summary.js";

/** A rule a pending leaderboard summary must pass. Check returns its problems, or none. */
export interface PendingLeaderboardSummaryRule {
  check(item: PendingLeaderboardSummary): string[];
}

export class PendingLeaderboardSummaryOpenRateRangeRule implements PendingLeaderboardSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingLeaderboardSummary): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingLeaderboardSummaryCodeLengthRule implements PendingLeaderboardSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingLeaderboardSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingLeaderboardSummaryRequiredPhoneRule implements PendingLeaderboardSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingLeaderboardSummary): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class PendingLeaderboardSummaryPhoneLengthRule implements PendingLeaderboardSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingLeaderboardSummary): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending leaderboard summary. */
export class PendingLeaderboardSummaryValidator {
  rules: PendingLeaderboardSummaryRule[];

  constructor(rules: PendingLeaderboardSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: PendingLeaderboardSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingLeaderboardSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingLeaderboardSummary[]): Map<string, string[]> {
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

export function defaultPendingLeaderboardSummaryValidator(): PendingLeaderboardSummaryValidator {
  return new PendingLeaderboardSummaryValidator(
    [
      new PendingLeaderboardSummaryOpenRateRangeRule(6.1, 2073.4),
      new PendingLeaderboardSummaryCodeLengthRule(64),
      new PendingLeaderboardSummaryRequiredPhoneRule("pending leaderboard summary needs a value"),
      new PendingLeaderboardSummaryPhoneLengthRule(120),
    ],
  );
}
