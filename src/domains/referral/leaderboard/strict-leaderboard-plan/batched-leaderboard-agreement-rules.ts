import { BatchedLeaderboardAgreement } from "./batched-leaderboard-agreement.js";

/** A rule a batched leaderboard agreement must pass. Check returns its problems, or none. */
export interface BatchedLeaderboardAgreementRule {
  check(item: BatchedLeaderboardAgreement): string[];
}

export class BatchedLeaderboardAgreementRequiredVariantRule implements BatchedLeaderboardAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedLeaderboardAgreement): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedLeaderboardAgreementTitleLengthRule implements BatchedLeaderboardAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedLeaderboardAgreement): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedLeaderboardAgreementRequiredTitleRule implements BatchedLeaderboardAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedLeaderboardAgreement): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedLeaderboardAgreementRetriesRangeRule implements BatchedLeaderboardAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedLeaderboardAgreement): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a batched leaderboard agreement. */
export class BatchedLeaderboardAgreementValidator {
  rules: BatchedLeaderboardAgreementRule[];

  constructor(rules: BatchedLeaderboardAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedLeaderboardAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedLeaderboardAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedLeaderboardAgreement[]): Map<string, string[]> {
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

export function defaultBatchedLeaderboardAgreementValidator(): BatchedLeaderboardAgreementValidator {
  return new BatchedLeaderboardAgreementValidator(
    [
      new BatchedLeaderboardAgreementRequiredVariantRule("batched leaderboard agreement needs an entry"),
      new BatchedLeaderboardAgreementTitleLengthRule(3600),
      new BatchedLeaderboardAgreementRequiredTitleRule("batched leaderboard agreement needs an entry"),
      new BatchedLeaderboardAgreementRetriesRangeRule(32, 1000),
    ],
  );
}
