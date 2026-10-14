import { FallbackLeaderboardPolicy } from "./fallback-leaderboard-policy.js";

/** A rule a fallback leaderboard policy must pass. Check returns its problems, or none. */
export interface FallbackLeaderboardPolicyRule {
  check(item: FallbackLeaderboardPolicy): string[];
}

export class FallbackLeaderboardPolicyCodeLengthRule implements FallbackLeaderboardPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackLeaderboardPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackLeaderboardPolicyWindowDaysRangeRule implements FallbackLeaderboardPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackLeaderboardPolicy): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackLeaderboardPolicyAmountRangeRule implements FallbackLeaderboardPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackLeaderboardPolicy): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackLeaderboardPolicyCampaignRefLengthRule implements FallbackLeaderboardPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackLeaderboardPolicy): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackLeaderboardPolicyCodePrefixRule implements FallbackLeaderboardPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackLeaderboardPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a fallback leaderboard policy. */
export class FallbackLeaderboardPolicyValidator {
  rules: FallbackLeaderboardPolicyRule[];

  constructor(rules: FallbackLeaderboardPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackLeaderboardPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackLeaderboardPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackLeaderboardPolicy[]): Map<string, string[]> {
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

export function defaultFallbackLeaderboardPolicyValidator(): FallbackLeaderboardPolicyValidator {
  return new FallbackLeaderboardPolicyValidator(
    [
      new FallbackLeaderboardPolicyCodeLengthRule(255),
      new FallbackLeaderboardPolicyWindowDaysRangeRule(255, 255),
      new FallbackLeaderboardPolicyAmountRangeRule(0.1, 2144),
      new FallbackLeaderboardPolicyCampaignRefLengthRule(16),
      new FallbackLeaderboardPolicyCodePrefixRule("ACM"),
    ],
  );
}
