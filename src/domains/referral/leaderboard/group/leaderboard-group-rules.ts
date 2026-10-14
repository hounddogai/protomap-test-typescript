import * as text from "../../../../kit/text.js";
import { LeaderboardGroup } from "./leaderboard-group.js";

/** A rule a leaderboard group must pass. Check returns its problems, or none. */
export interface LeaderboardGroupRule {
  check(item: LeaderboardGroup): string[];
}

export class LeaderboardGroupChecksumLengthRule implements LeaderboardGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardGroup): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardGroupCodePrefixRule implements LeaderboardGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LeaderboardGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LeaderboardGroupLabelLengthRule implements LeaderboardGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardGroup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardGroupQuantityRangeRule implements LeaderboardGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardGroup): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LeaderboardGroupAllowedChecksumRule implements LeaderboardGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LeaderboardGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is unknown`];
    return [];
  }
}

export class LeaderboardGroupRequiredChecksumRule implements LeaderboardGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardGroup): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a leaderboard group. */
export class LeaderboardGroupValidator {
  rules: LeaderboardGroupRule[];

  constructor(rules: LeaderboardGroupRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LeaderboardGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardGroup[]): Map<string, string[]> {
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

export function defaultLeaderboardGroupValidator(): LeaderboardGroupValidator {
  return new LeaderboardGroupValidator(
    [
      new LeaderboardGroupChecksumLengthRule(16),
      new LeaderboardGroupCodePrefixRule("REF"),
      new LeaderboardGroupLabelLengthRule(255),
      new LeaderboardGroupQuantityRangeRule(1000, 86400),
      new LeaderboardGroupAllowedChecksumRule(["pending", "capped", "rolling"]),
      new LeaderboardGroupRequiredChecksumRule("leaderboard group needs a value"),
    ],
  );
}
