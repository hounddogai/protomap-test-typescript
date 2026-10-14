import * as text from "../../../../kit/text.js";
import { LeaderboardAgreement } from "./leaderboard-agreement.js";

/** A rule a leaderboard agreement must pass. Check returns its problems, or none. */
export interface LeaderboardAgreementRule {
  check(item: LeaderboardAgreement): string[];
}

export class LeaderboardAgreementRequiredNameRule implements LeaderboardAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardAgreement): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardAgreementRequiredPhoneRule implements LeaderboardAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardAgreement): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardAgreementAllowedCodeRule implements LeaderboardAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LeaderboardAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

/** Runs every rule of a leaderboard agreement. */
export class LeaderboardAgreementValidator {
  rules: LeaderboardAgreementRule[];

  constructor(rules: LeaderboardAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LeaderboardAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardAgreement[]): Map<string, string[]> {
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

export function defaultLeaderboardAgreementValidator(): LeaderboardAgreementValidator {
  return new LeaderboardAgreementValidator(
    [
      new LeaderboardAgreementRequiredNameRule("leaderboard agreement needs a value"),
      new LeaderboardAgreementRequiredPhoneRule("leaderboard agreement needs a value"),
      new LeaderboardAgreementAllowedCodeRule(["manual"]),
    ],
  );
}
