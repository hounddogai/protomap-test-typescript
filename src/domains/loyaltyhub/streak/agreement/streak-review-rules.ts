import { StreakReview } from "./streak-review.js";

/** A rule a streak review must pass. Check returns its problems, or none. */
export interface StreakReviewRule {
  check(item: StreakReview): string[];
}

export class StreakReviewCampaignRefLengthRule implements StreakReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakReview): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakReviewRequiredCodeRule implements StreakReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StreakReviewMarginRangeRule implements StreakReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakReview): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StreakReviewChannelLengthRule implements StreakReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakReview): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakReviewCodeLengthRule implements StreakReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakReviewPriorityRangeRule implements StreakReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakReview): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a streak review. */
export class StreakReviewValidator {
  rules: StreakReviewRule[];

  constructor(rules: StreakReviewRule[]) {
    this.rules = rules;
  }

  validate(item: StreakReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StreakReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakReview[]): Map<string, string[]> {
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

export function defaultStreakReviewValidator(): StreakReviewValidator {
  return new StreakReviewValidator(
    [
      new StreakReviewCampaignRefLengthRule(86400),
      new StreakReviewRequiredCodeRule("streak review needs an entry"),
      new StreakReviewMarginRangeRule(3.6, 596.4),
      new StreakReviewChannelLengthRule(255),
      new StreakReviewCodeLengthRule(80),
      new StreakReviewPriorityRangeRule(80, 3600),
    ],
  );
}
