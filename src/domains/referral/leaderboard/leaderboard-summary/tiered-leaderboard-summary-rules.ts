import { TieredLeaderboardSummary } from "./tiered-leaderboard-summary.js";

/** A rule a tiered leaderboard summary must pass. Check returns its problems, or none. */
export interface TieredLeaderboardSummaryRule {
  check(item: TieredLeaderboardSummary): string[];
}

export class TieredLeaderboardSummaryTitleLengthRule implements TieredLeaderboardSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredLeaderboardSummary): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredLeaderboardSummaryRequiredChecksumRule implements TieredLeaderboardSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredLeaderboardSummary): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class TieredLeaderboardSummaryTagsLimitRule implements TieredLeaderboardSummaryRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: TieredLeaderboardSummary): string[] {
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

export class TieredLeaderboardSummaryCodeLengthRule implements TieredLeaderboardSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredLeaderboardSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered leaderboard summary. */
export class TieredLeaderboardSummaryValidator {
  rules: TieredLeaderboardSummaryRule[];

  constructor(rules: TieredLeaderboardSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: TieredLeaderboardSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredLeaderboardSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredLeaderboardSummary[]): Map<string, string[]> {
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

export function defaultTieredLeaderboardSummaryValidator(): TieredLeaderboardSummaryValidator {
  return new TieredLeaderboardSummaryValidator(
    [
      new TieredLeaderboardSummaryTitleLengthRule(120),
      new TieredLeaderboardSummaryRequiredChecksumRule("tiered leaderboard summary needs an entry"),
      new TieredLeaderboardSummaryTagsLimitRule(64, ["default", "batched"]),
      new TieredLeaderboardSummaryCodeLengthRule(16),
    ],
  );
}
