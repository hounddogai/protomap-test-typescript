import { LeaderboardSlot } from "./leaderboard-slot.js";

/** A rule a leaderboard slot must pass. Check returns its problems, or none. */
export interface LeaderboardSlotRule {
  check(item: LeaderboardSlot): string[];
}

export class LeaderboardSlotImpressionsRangeRule implements LeaderboardSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardSlot): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LeaderboardSlotRequiredSourceRule implements LeaderboardSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardSlot): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardSlotCodePrefixRule implements LeaderboardSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LeaderboardSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a leaderboard slot. */
export class LeaderboardSlotValidator {
  rules: LeaderboardSlotRule[];

  constructor(rules: LeaderboardSlotRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardSlot): string[] {
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

  requireValid(item: LeaderboardSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardSlot[]): Map<string, string[]> {
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

export function defaultLeaderboardSlotValidator(): LeaderboardSlotValidator {
  return new LeaderboardSlotValidator(
    [
      new LeaderboardSlotImpressionsRangeRule(1000, 1000),
      new LeaderboardSlotRequiredSourceRule("leaderboard slot needs this field"),
      new LeaderboardSlotCodePrefixRule("ACM"),
    ],
  );
}
