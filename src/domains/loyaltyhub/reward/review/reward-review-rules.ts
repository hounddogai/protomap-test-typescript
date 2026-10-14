import * as text from "../../../../kit/text.js";
import { RewardReview } from "./reward-review.js";

/** A rule a reward review must pass. Check returns its problems, or none. */
export interface RewardReviewRule {
  check(item: RewardReview): string[];
}

export class RewardReviewAllowedTitleRule implements RewardReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is blocked`];
    return [];
  }
}

export class RewardReviewRequiredTitleRule implements RewardReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RewardReviewTitleLengthRule implements RewardReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardReview): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward review. */
export class RewardReviewValidator {
  rules: RewardReviewRule[];

  constructor(rules: RewardReviewRule[]) {
    this.rules = rules;
  }

  validate(item: RewardReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardReview[]): Map<string, string[]> {
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

export function defaultRewardReviewValidator(): RewardReviewValidator {
  return new RewardReviewValidator(
    [
      new RewardReviewAllowedTitleRule(["regional", "capped"]),
      new RewardReviewRequiredTitleRule("reward review needs a value"),
      new RewardReviewTitleLengthRule(64),
    ],
  );
}
