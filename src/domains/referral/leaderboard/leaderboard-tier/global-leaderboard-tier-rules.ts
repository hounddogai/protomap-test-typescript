import * as text from "../../../../kit/text.js";
import { GlobalLeaderboardTier } from "./global-leaderboard-tier.js";

/** A rule a global leaderboard tier must pass. Check returns its problems, or none. */
export interface GlobalLeaderboardTierRule {
  check(item: GlobalLeaderboardTier): string[];
}

export class GlobalLeaderboardTierWindowDaysRangeRule implements GlobalLeaderboardTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalLeaderboardTier): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalLeaderboardTierAllowedCodeRule implements GlobalLeaderboardTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalLeaderboardTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class GlobalLeaderboardTierCodePrefixRule implements GlobalLeaderboardTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalLeaderboardTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalLeaderboardTierLabelLengthRule implements GlobalLeaderboardTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalLeaderboardTier): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global leaderboard tier. */
export class GlobalLeaderboardTierValidator {
  rules: GlobalLeaderboardTierRule[];

  constructor(rules: GlobalLeaderboardTierRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalLeaderboardTier): string[] {
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

  requireValid(item: GlobalLeaderboardTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalLeaderboardTier[]): Map<string, string[]> {
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

export function defaultGlobalLeaderboardTierValidator(): GlobalLeaderboardTierValidator {
  return new GlobalLeaderboardTierValidator(
    [
      new GlobalLeaderboardTierWindowDaysRangeRule(120, 86400),
      new GlobalLeaderboardTierAllowedCodeRule(["seasonal", "manual"]),
      new GlobalLeaderboardTierCodePrefixRule("X"),
      new GlobalLeaderboardTierLabelLengthRule(86400),
    ],
  );
}
