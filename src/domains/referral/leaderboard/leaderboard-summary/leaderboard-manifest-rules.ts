import { LeaderboardManifest } from "./leaderboard-manifest.js";

/** A rule a leaderboard manifest must pass. Check returns its problems, or none. */
export interface LeaderboardManifestRule {
  check(item: LeaderboardManifest): string[];
}

export class LeaderboardManifestCategoryLengthRule implements LeaderboardManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardManifest): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardManifestRequiredCodeRule implements LeaderboardManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardManifestCodePrefixRule implements LeaderboardManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LeaderboardManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LeaderboardManifestTitleLengthRule implements LeaderboardManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardManifest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardManifestVersionRangeRule implements LeaderboardManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardManifest): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a leaderboard manifest. */
export class LeaderboardManifestValidator {
  rules: LeaderboardManifestRule[];

  constructor(rules: LeaderboardManifestRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LeaderboardManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardManifest[]): Map<string, string[]> {
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

export function defaultLeaderboardManifestValidator(): LeaderboardManifestValidator {
  return new LeaderboardManifestValidator(
    [
      new LeaderboardManifestCategoryLengthRule(16),
      new LeaderboardManifestRequiredCodeRule("leaderboard manifest needs a value"),
      new LeaderboardManifestCodePrefixRule("Q"),
      new LeaderboardManifestTitleLengthRule(1000),
      new LeaderboardManifestVersionRangeRule(64, 86400),
    ],
  );
}
