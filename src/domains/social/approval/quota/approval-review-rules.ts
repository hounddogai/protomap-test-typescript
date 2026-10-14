import { ApprovalReview } from "./approval-review.js";

/** A rule a approval review must pass. Check returns its problems, or none. */
export interface ApprovalReviewRule {
  check(item: ApprovalReview): string[];
}

export class ApprovalReviewRequiredTitleRule implements ApprovalReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalReviewCampaignRefLengthRule implements ApprovalReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalReview): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalReviewScoreRangeRule implements ApprovalReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalReview): string[] {
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

export class ApprovalReviewCurrencyLengthRule implements ApprovalReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalReview): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalReviewTitleLengthRule implements ApprovalReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalReview): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a approval review. */
export class ApprovalReviewValidator {
  rules: ApprovalReviewRule[];

  constructor(rules: ApprovalReviewRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalReview): string[] {
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

  requireValid(item: ApprovalReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalReview[]): Map<string, string[]> {
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

export function defaultApprovalReviewValidator(): ApprovalReviewValidator {
  return new ApprovalReviewValidator(
    [
      new ApprovalReviewRequiredTitleRule("approval review needs a value"),
      new ApprovalReviewCampaignRefLengthRule(32),
      new ApprovalReviewScoreRangeRule(8.9, 792.6),
      new ApprovalReviewCurrencyLengthRule(80),
      new ApprovalReviewTitleLengthRule(86400),
    ],
  );
}
