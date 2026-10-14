import * as text from "../../../../kit/text.js";
import { LeaderboardBatch } from "./leaderboard-batch.js";

/** A rule a leaderboard batch must pass. Check returns its problems, or none. */
export interface LeaderboardBatchRule {
  check(item: LeaderboardBatch): string[];
}

export class LeaderboardBatchRequiredExternalRefRule implements LeaderboardBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardBatch): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardBatchAllowedTitleRule implements LeaderboardBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LeaderboardBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is stale`];
    return [];
  }
}

export class LeaderboardBatchImpressionsRangeRule implements LeaderboardBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardBatch): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LeaderboardBatchEndsAtRangeRule implements LeaderboardBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardBatch): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LeaderboardBatchRequiredTitleRule implements LeaderboardBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardBatch): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardBatchCodePrefixRule implements LeaderboardBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LeaderboardBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a leaderboard batch. */
export class LeaderboardBatchValidator {
  rules: LeaderboardBatchRule[];

  constructor(rules: LeaderboardBatchRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardBatch): string[] {
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

  requireValid(item: LeaderboardBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardBatch[]): Map<string, string[]> {
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

export function defaultLeaderboardBatchValidator(): LeaderboardBatchValidator {
  return new LeaderboardBatchValidator(
    [
      new LeaderboardBatchRequiredExternalRefRule("leaderboard batch needs an entry"),
      new LeaderboardBatchAllowedTitleRule([]),
      new LeaderboardBatchImpressionsRangeRule(80, 3600),
      new LeaderboardBatchEndsAtRangeRule(255, 3600),
      new LeaderboardBatchRequiredTitleRule("leaderboard batch needs an entry"),
      new LeaderboardBatchCodePrefixRule("X"),
    ],
  );
}
