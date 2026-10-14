import * as text from "../../../../kit/text.js";
import { LeaderboardTier } from "./leaderboard-tier.js";

/** A rule a leaderboard tier must pass. Check returns its problems, or none. */
export interface LeaderboardTierRule {
  check(item: LeaderboardTier): string[];
}

export class LeaderboardTierPinnedGuardRule implements LeaderboardTierRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LeaderboardTier): string[] {
    if (item.pinned && item.version > this.limit) return [`version ${item.version} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class LeaderboardTierVersionRangeRule implements LeaderboardTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardTier): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LeaderboardTierCodeLengthRule implements LeaderboardTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardTierCodePrefixRule implements LeaderboardTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LeaderboardTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LeaderboardTierAllowedCodeRule implements LeaderboardTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LeaderboardTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class LeaderboardTierRequiredCodeRule implements LeaderboardTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a leaderboard tier. */
export class LeaderboardTierValidator {
  rules: LeaderboardTierRule[];

  constructor(rules: LeaderboardTierRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LeaderboardTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardTier[]): Map<string, string[]> {
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

export function defaultLeaderboardTierValidator(): LeaderboardTierValidator {
  return new LeaderboardTierValidator(
    [
      new LeaderboardTierPinnedGuardRule(3600),
      new LeaderboardTierVersionRangeRule(16, 255),
      new LeaderboardTierCodeLengthRule(3600),
      new LeaderboardTierCodePrefixRule("Q"),
      new LeaderboardTierAllowedCodeRule(["primary", "global", "legacy"]),
      new LeaderboardTierRequiredCodeRule("leaderboard tier needs an entry"),
    ],
  );
}
