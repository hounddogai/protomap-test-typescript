import { LeaderboardAdjustment } from "./leaderboard-adjustment.js";

/** A rule a leaderboard adjustment must pass. Check returns its problems, or none. */
export interface LeaderboardAdjustmentRule {
  check(item: LeaderboardAdjustment): string[];
}

export class LeaderboardAdjustmentRequiredCampaignRefRule implements LeaderboardAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardAdjustment): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardAdjustmentRequiredLabelRule implements LeaderboardAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardAdjustment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardAdjustmentArchivedGuardRule implements LeaderboardAdjustmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LeaderboardAdjustment): string[] {
    if (item.archived && item.threshold > this.limit) return [`threshold ${item.threshold} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class LeaderboardAdjustmentJourneyIdLengthRule implements LeaderboardAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardAdjustment): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardAdjustmentCampaignRefLengthRule implements LeaderboardAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardAdjustment): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardAdjustmentThresholdRangeRule implements LeaderboardAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardAdjustment): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a leaderboard adjustment. */
export class LeaderboardAdjustmentValidator {
  rules: LeaderboardAdjustmentRule[];

  constructor(rules: LeaderboardAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardAdjustment): string[] {
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

  requireValid(item: LeaderboardAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardAdjustment[]): Map<string, string[]> {
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

export function defaultLeaderboardAdjustmentValidator(): LeaderboardAdjustmentValidator {
  return new LeaderboardAdjustmentValidator(
    [
      new LeaderboardAdjustmentRequiredCampaignRefRule("leaderboard adjustment needs a value"),
      new LeaderboardAdjustmentRequiredLabelRule("leaderboard adjustment needs this field"),
      new LeaderboardAdjustmentArchivedGuardRule(3.3),
      new LeaderboardAdjustmentJourneyIdLengthRule(80),
      new LeaderboardAdjustmentCampaignRefLengthRule(80),
      new LeaderboardAdjustmentThresholdRangeRule(8, 2341.1),
    ],
  );
}
