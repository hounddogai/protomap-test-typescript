import * as text from "../../../../kit/text.js";
import { RewardRuleReview } from "./reward-rule-review.js";

/** A rule a reward rule review must pass. Check returns its problems, or none. */
export interface RewardRuleReviewRule {
  check(item: RewardRuleReview): string[];
}

export class RewardRuleReviewRetriesRangeRule implements RewardRuleReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleReview): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardRuleReviewAllowedChannelRule implements RewardRuleReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardRuleReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is stale`];
    return [];
  }
}

export class RewardRuleReviewRequiredTitleRule implements RewardRuleReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reward rule review. */
export class RewardRuleReviewValidator {
  rules: RewardRuleReviewRule[];

  constructor(rules: RewardRuleReviewRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleReview): string[] {
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

  requireValid(item: RewardRuleReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleReview[]): Map<string, string[]> {
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

export function defaultRewardRuleReviewValidator(): RewardRuleReviewValidator {
  return new RewardRuleReviewValidator(
    [
      new RewardRuleReviewRetriesRangeRule(32, 64),
      new RewardRuleReviewAllowedChannelRule(["manual", "manual", "tiered"]),
      new RewardRuleReviewRequiredTitleRule("reward rule review needs this field"),
    ],
  );
}
