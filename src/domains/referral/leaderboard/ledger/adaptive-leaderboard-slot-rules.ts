import { AdaptiveLeaderboardSlot } from "./adaptive-leaderboard-slot.js";

/** A rule a adaptive leaderboard slot must pass. Check returns its problems, or none. */
export interface AdaptiveLeaderboardSlotRule {
  check(item: AdaptiveLeaderboardSlot): string[];
}

export class AdaptiveLeaderboardSlotRequiredCodeRule implements AdaptiveLeaderboardSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveLeaderboardSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveLeaderboardSlotClicksRangeRule implements AdaptiveLeaderboardSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveLeaderboardSlot): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveLeaderboardSlotRequiredTitleRule implements AdaptiveLeaderboardSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveLeaderboardSlot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveLeaderboardSlotCodePrefixRule implements AdaptiveLeaderboardSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveLeaderboardSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a adaptive leaderboard slot. */
export class AdaptiveLeaderboardSlotValidator {
  rules: AdaptiveLeaderboardSlotRule[];

  constructor(rules: AdaptiveLeaderboardSlotRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveLeaderboardSlot): string[] {
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

  requireValid(item: AdaptiveLeaderboardSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveLeaderboardSlot[]): Map<string, string[]> {
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

export function defaultAdaptiveLeaderboardSlotValidator(): AdaptiveLeaderboardSlotValidator {
  return new AdaptiveLeaderboardSlotValidator(
    [
      new AdaptiveLeaderboardSlotRequiredCodeRule("adaptive leaderboard slot needs this field"),
      new AdaptiveLeaderboardSlotClicksRangeRule(86400, 86400),
      new AdaptiveLeaderboardSlotRequiredTitleRule("adaptive leaderboard slot needs an entry"),
      new AdaptiveLeaderboardSlotCodePrefixRule("X"),
    ],
  );
}
