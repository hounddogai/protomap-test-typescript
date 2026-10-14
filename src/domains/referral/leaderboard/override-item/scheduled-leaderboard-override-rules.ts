import { ScheduledLeaderboardOverride } from "./scheduled-leaderboard-override.js";

/** A rule a scheduled leaderboard override must pass. Check returns its problems, or none. */
export interface ScheduledLeaderboardOverrideRule {
  check(item: ScheduledLeaderboardOverride): string[];
}

export class ScheduledLeaderboardOverrideCodePrefixRule implements ScheduledLeaderboardOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledLeaderboardOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledLeaderboardOverrideTagsLimitRule implements ScheduledLeaderboardOverrideRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ScheduledLeaderboardOverride): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class ScheduledLeaderboardOverrideExpiresAtRangeRule implements ScheduledLeaderboardOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledLeaderboardOverride): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledLeaderboardOverrideCeilingRangeRule implements ScheduledLeaderboardOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledLeaderboardOverride): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledLeaderboardOverrideTitleLengthRule implements ScheduledLeaderboardOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledLeaderboardOverride): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledLeaderboardOverrideRequiredSourceRule implements ScheduledLeaderboardOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledLeaderboardOverride): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled leaderboard override. */
export class ScheduledLeaderboardOverrideValidator {
  rules: ScheduledLeaderboardOverrideRule[];

  constructor(rules: ScheduledLeaderboardOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledLeaderboardOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledLeaderboardOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledLeaderboardOverride[]): Map<string, string[]> {
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

export function defaultScheduledLeaderboardOverrideValidator(): ScheduledLeaderboardOverrideValidator {
  return new ScheduledLeaderboardOverrideValidator(
    [
      new ScheduledLeaderboardOverrideCodePrefixRule("REF"),
      new ScheduledLeaderboardOverrideTagsLimitRule(120, ["adaptive", "lenient"]),
      new ScheduledLeaderboardOverrideExpiresAtRangeRule(32, 255),
      new ScheduledLeaderboardOverrideCeilingRangeRule(9.5, 1342.7),
      new ScheduledLeaderboardOverrideTitleLengthRule(255),
      new ScheduledLeaderboardOverrideRequiredSourceRule("scheduled leaderboard override needs an entry"),
    ],
  );
}
