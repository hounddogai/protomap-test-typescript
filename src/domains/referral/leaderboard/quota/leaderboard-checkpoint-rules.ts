import { LeaderboardCheckpoint } from "./leaderboard-checkpoint.js";

/** A rule a leaderboard checkpoint must pass. Check returns its problems, or none. */
export interface LeaderboardCheckpointRule {
  check(item: LeaderboardCheckpoint): string[];
}

export class LeaderboardCheckpointRequiredLabelRule implements LeaderboardCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardCheckpoint): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardCheckpointCostRangeRule implements LeaderboardCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardCheckpoint): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LeaderboardCheckpointCodeLengthRule implements LeaderboardCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardCheckpointLabelLengthRule implements LeaderboardCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardCheckpoint): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardCheckpointCodePrefixRule implements LeaderboardCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LeaderboardCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LeaderboardCheckpointRequiredSegmentRule implements LeaderboardCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardCheckpoint): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a leaderboard checkpoint. */
export class LeaderboardCheckpointValidator {
  rules: LeaderboardCheckpointRule[];

  constructor(rules: LeaderboardCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardCheckpoint): string[] {
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

  requireValid(item: LeaderboardCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardCheckpoint[]): Map<string, string[]> {
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

export function defaultLeaderboardCheckpointValidator(): LeaderboardCheckpointValidator {
  return new LeaderboardCheckpointValidator(
    [
      new LeaderboardCheckpointRequiredLabelRule("leaderboard checkpoint needs an entry"),
      new LeaderboardCheckpointCostRangeRule(3.4, 966.6),
      new LeaderboardCheckpointCodeLengthRule(255),
      new LeaderboardCheckpointLabelLengthRule(1000),
      new LeaderboardCheckpointCodePrefixRule("ACM"),
      new LeaderboardCheckpointRequiredSegmentRule("leaderboard checkpoint needs an entry"),
    ],
  );
}
