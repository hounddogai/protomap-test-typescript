import { LeaderboardBundle } from "./leaderboard-bundle.js";

/** A rule a leaderboard bundle must pass. Check returns its problems, or none. */
export interface LeaderboardBundleRule {
  check(item: LeaderboardBundle): string[];
}

export class LeaderboardBundleLabelLengthRule implements LeaderboardBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardBundle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardBundleCohortLengthRule implements LeaderboardBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardBundle): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardBundleChecksumLengthRule implements LeaderboardBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardBundle): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardBundleRequiredCodeRule implements LeaderboardBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a leaderboard bundle. */
export class LeaderboardBundleValidator {
  rules: LeaderboardBundleRule[];

  constructor(rules: LeaderboardBundleRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardBundle): string[] {
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

  requireValid(item: LeaderboardBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardBundle[]): Map<string, string[]> {
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

export function defaultLeaderboardBundleValidator(): LeaderboardBundleValidator {
  return new LeaderboardBundleValidator(
    [
      new LeaderboardBundleLabelLengthRule(86400),
      new LeaderboardBundleCohortLengthRule(1000),
      new LeaderboardBundleChecksumLengthRule(80),
      new LeaderboardBundleRequiredCodeRule("leaderboard bundle needs a value"),
    ],
  );
}
