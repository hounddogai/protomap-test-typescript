import * as text from "../../../../kit/text.js";
import { LeaderboardOverride } from "./leaderboard-override.js";

/** A rule a leaderboard override must pass. Check returns its problems, or none. */
export interface LeaderboardOverrideRule {
  check(item: LeaderboardOverride): string[];
}

export class LeaderboardOverrideFrequencyCapRangeRule implements LeaderboardOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardOverride): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LeaderboardOverrideRequiredNameRule implements LeaderboardOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardOverride): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardOverrideNameLengthRule implements LeaderboardOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardOverride): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardOverrideRequiredLabelRule implements LeaderboardOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardOverride): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardOverrideAllowedNameRule implements LeaderboardOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LeaderboardOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a leaderboard override. */
export class LeaderboardOverrideValidator {
  rules: LeaderboardOverrideRule[];

  constructor(rules: LeaderboardOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LeaderboardOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardOverride[]): Map<string, string[]> {
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

export function defaultLeaderboardOverrideValidator(): LeaderboardOverrideValidator {
  return new LeaderboardOverrideValidator(
    [
      new LeaderboardOverrideFrequencyCapRangeRule(32, 255),
      new LeaderboardOverrideRequiredNameRule("leaderboard override needs an entry"),
      new LeaderboardOverrideNameLengthRule(80),
      new LeaderboardOverrideRequiredLabelRule("leaderboard override needs an entry"),
      new LeaderboardOverrideAllowedNameRule(["regional"]),
    ],
  );
}
