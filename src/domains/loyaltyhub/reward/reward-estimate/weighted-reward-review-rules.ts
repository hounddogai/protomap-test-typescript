import { WeightedRewardReview } from "./weighted-reward-review.js";

/** A rule a weighted reward review must pass. Check returns its problems, or none. */
export interface WeightedRewardReviewRule {
  check(item: WeightedRewardReview): string[];
}

export class WeightedRewardReviewCodeLengthRule implements WeightedRewardReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedRewardReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedRewardReviewRequiredChecksumRule implements WeightedRewardReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedRewardReview): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedRewardReviewTitleLengthRule implements WeightedRewardReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedRewardReview): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedRewardReviewRequiredTitleRule implements WeightedRewardReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedRewardReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted reward review. */
export class WeightedRewardReviewValidator {
  rules: WeightedRewardReviewRule[];

  constructor(rules: WeightedRewardReviewRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedRewardReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedRewardReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedRewardReview[]): Map<string, string[]> {
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

export function defaultWeightedRewardReviewValidator(): WeightedRewardReviewValidator {
  return new WeightedRewardReviewValidator(
    [
      new WeightedRewardReviewCodeLengthRule(1000),
      new WeightedRewardReviewRequiredChecksumRule("weighted reward review needs this field"),
      new WeightedRewardReviewTitleLengthRule(80),
      new WeightedRewardReviewRequiredTitleRule("weighted reward review needs an entry"),
    ],
  );
}
