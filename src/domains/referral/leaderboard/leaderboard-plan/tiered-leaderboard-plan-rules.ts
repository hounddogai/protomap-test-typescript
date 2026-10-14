import { TieredLeaderboardPlan } from "./tiered-leaderboard-plan.js";

/** A rule a tiered leaderboard plan must pass. Check returns its problems, or none. */
export interface TieredLeaderboardPlanRule {
  check(item: TieredLeaderboardPlan): string[];
}

export class TieredLeaderboardPlanRequiredNameRule implements TieredLeaderboardPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredLeaderboardPlan): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredLeaderboardPlanCodePrefixRule implements TieredLeaderboardPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredLeaderboardPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredLeaderboardPlanExternalRefLengthRule implements TieredLeaderboardPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredLeaderboardPlan): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredLeaderboardPlanRequiredTimezoneRule implements TieredLeaderboardPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredLeaderboardPlan): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class TieredLeaderboardPlanPinnedGuardRule implements TieredLeaderboardPlanRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TieredLeaderboardPlan): string[] {
    if (item.pinned && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class TieredLeaderboardPlanExpiresAtRangeRule implements TieredLeaderboardPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredLeaderboardPlan): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered leaderboard plan. */
export class TieredLeaderboardPlanValidator {
  rules: TieredLeaderboardPlanRule[];

  constructor(rules: TieredLeaderboardPlanRule[]) {
    this.rules = rules;
  }

  validate(item: TieredLeaderboardPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredLeaderboardPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredLeaderboardPlan[]): Map<string, string[]> {
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

export function defaultTieredLeaderboardPlanValidator(): TieredLeaderboardPlanValidator {
  return new TieredLeaderboardPlanValidator(
    [
      new TieredLeaderboardPlanRequiredNameRule("tiered leaderboard plan needs an entry"),
      new TieredLeaderboardPlanCodePrefixRule("ACM"),
      new TieredLeaderboardPlanExternalRefLengthRule(3600),
      new TieredLeaderboardPlanRequiredTimezoneRule("tiered leaderboard plan needs a value"),
      new TieredLeaderboardPlanPinnedGuardRule(6.2),
      new TieredLeaderboardPlanExpiresAtRangeRule(16, 120),
    ],
  );
}
