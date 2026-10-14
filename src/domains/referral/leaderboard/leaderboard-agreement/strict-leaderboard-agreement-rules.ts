import * as text from "../../../../kit/text.js";
import { StrictLeaderboardAgreement } from "./strict-leaderboard-agreement.js";

/** A rule a strict leaderboard agreement must pass. Check returns its problems, or none. */
export interface StrictLeaderboardAgreementRule {
  check(item: StrictLeaderboardAgreement): string[];
}

export class StrictLeaderboardAgreementRequiredCodeRule implements StrictLeaderboardAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictLeaderboardAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictLeaderboardAgreementExpiresAtRangeRule implements StrictLeaderboardAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictLeaderboardAgreement): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictLeaderboardAgreementThresholdRangeRule implements StrictLeaderboardAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictLeaderboardAgreement): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictLeaderboardAgreementRequiredTitleRule implements StrictLeaderboardAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictLeaderboardAgreement): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictLeaderboardAgreementAllowedCodeRule implements StrictLeaderboardAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictLeaderboardAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class StrictLeaderboardAgreementRequiredLabelRule implements StrictLeaderboardAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictLeaderboardAgreement): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict leaderboard agreement. */
export class StrictLeaderboardAgreementValidator {
  rules: StrictLeaderboardAgreementRule[];

  constructor(rules: StrictLeaderboardAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: StrictLeaderboardAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictLeaderboardAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictLeaderboardAgreement[]): Map<string, string[]> {
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

export function defaultStrictLeaderboardAgreementValidator(): StrictLeaderboardAgreementValidator {
  return new StrictLeaderboardAgreementValidator(
    [
      new StrictLeaderboardAgreementRequiredCodeRule("strict leaderboard agreement needs this field"),
      new StrictLeaderboardAgreementExpiresAtRangeRule(80, 120),
      new StrictLeaderboardAgreementThresholdRangeRule(6, 3013.3),
      new StrictLeaderboardAgreementRequiredTitleRule("strict leaderboard agreement needs this field"),
      new StrictLeaderboardAgreementAllowedCodeRule(["seasonal"]),
      new StrictLeaderboardAgreementRequiredLabelRule("strict leaderboard agreement needs an entry"),
    ],
  );
}
