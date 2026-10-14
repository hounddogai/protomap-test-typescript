import * as text from "../../../../kit/text.js";
import { RollingLeaderboardAudit } from "./rolling-leaderboard-audit.js";

/** A rule a rolling leaderboard audit must pass. Check returns its problems, or none. */
export interface RollingLeaderboardAuditRule {
  check(item: RollingLeaderboardAudit): string[];
}

export class RollingLeaderboardAuditCodePrefixRule implements RollingLeaderboardAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingLeaderboardAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingLeaderboardAuditScoreRangeRule implements RollingLeaderboardAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingLeaderboardAudit): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingLeaderboardAuditAllowedContactEmailRule implements RollingLeaderboardAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingLeaderboardAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is duplicated`];
    return [];
  }
}

export class RollingLeaderboardAuditContactEmailLengthRule implements RollingLeaderboardAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingLeaderboardAudit): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingLeaderboardAuditRequiredCodeRule implements RollingLeaderboardAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingLeaderboardAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling leaderboard audit. */
export class RollingLeaderboardAuditValidator {
  rules: RollingLeaderboardAuditRule[];

  constructor(rules: RollingLeaderboardAuditRule[]) {
    this.rules = rules;
  }

  validate(item: RollingLeaderboardAudit): string[] {
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

  requireValid(item: RollingLeaderboardAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingLeaderboardAudit[]): Map<string, string[]> {
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

export function defaultRollingLeaderboardAuditValidator(): RollingLeaderboardAuditValidator {
  return new RollingLeaderboardAuditValidator(
    [
      new RollingLeaderboardAuditCodePrefixRule("X"),
      new RollingLeaderboardAuditScoreRangeRule(5.7, 1154.4),
      new RollingLeaderboardAuditAllowedContactEmailRule(["lenient"]),
      new RollingLeaderboardAuditContactEmailLengthRule(64),
      new RollingLeaderboardAuditRequiredCodeRule("rolling leaderboard audit needs an entry"),
    ],
  );
}
