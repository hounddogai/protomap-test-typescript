import * as text from "../../../../kit/text.js";
import { NudgeReview } from "./nudge-review.js";

/** A rule a nudge review must pass. Check returns its problems, or none. */
export interface NudgeReviewRule {
  check(item: NudgeReview): string[];
}

export class NudgeReviewChannelLengthRule implements NudgeReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeReview): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeReviewAllowedTitleRule implements NudgeReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: NudgeReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is duplicated`];
    return [];
  }
}

export class NudgeReviewCeilingRangeRule implements NudgeReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeReview): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class NudgeReviewRequiredChannelRule implements NudgeReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeReview): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeReviewBatchSizeRangeRule implements NudgeReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeReview): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a nudge review. */
export class NudgeReviewValidator {
  rules: NudgeReviewRule[];

  constructor(rules: NudgeReviewRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeReview): string[] {
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

  requireValid(item: NudgeReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeReview[]): Map<string, string[]> {
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

export function defaultNudgeReviewValidator(): NudgeReviewValidator {
  return new NudgeReviewValidator(
    [
      new NudgeReviewChannelLengthRule(255),
      new NudgeReviewAllowedTitleRule([]),
      new NudgeReviewCeilingRangeRule(5.5, 2327.5),
      new NudgeReviewRequiredChannelRule("nudge review needs a value"),
      new NudgeReviewBatchSizeRangeRule(16, 3600),
    ],
  );
}
