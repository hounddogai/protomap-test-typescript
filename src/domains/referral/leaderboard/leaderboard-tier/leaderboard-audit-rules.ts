import { LeaderboardAudit } from "./leaderboard-audit.js";

/** A rule a leaderboard audit must pass. Check returns its problems, or none. */
export interface LeaderboardAuditRule {
  check(item: LeaderboardAudit): string[];
}

export class LeaderboardAuditRatioRangeRule implements LeaderboardAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardAudit): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LeaderboardAuditTitleLengthRule implements LeaderboardAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardAudit): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardAuditCodePrefixRule implements LeaderboardAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LeaderboardAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a leaderboard audit. */
export class LeaderboardAuditValidator {
  rules: LeaderboardAuditRule[];

  constructor(rules: LeaderboardAuditRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LeaderboardAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardAudit[]): Map<string, string[]> {
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

export function defaultLeaderboardAuditValidator(): LeaderboardAuditValidator {
  return new LeaderboardAuditValidator(
    [
      new LeaderboardAuditRatioRangeRule(3.6, 3697.7),
      new LeaderboardAuditTitleLengthRule(3600),
      new LeaderboardAuditCodePrefixRule("X"),
    ],
  );
}
