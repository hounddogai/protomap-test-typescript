import * as text from "../../../../kit/text.js";
import { BatchedDoubleOptInReview } from "./batched-double-opt-in-review.js";

/** A rule a batched double opt in review must pass. Check returns its problems, or none. */
export interface BatchedDoubleOptInReviewRule {
  check(item: BatchedDoubleOptInReview): string[];
}

export class BatchedDoubleOptInReviewAudienceIdLengthRule implements BatchedDoubleOptInReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedDoubleOptInReview): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedDoubleOptInReviewSequenceRangeRule implements BatchedDoubleOptInReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedDoubleOptInReview): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedDoubleOptInReviewRequiredCodeRule implements BatchedDoubleOptInReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedDoubleOptInReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedDoubleOptInReviewAllowedLocaleRule implements BatchedDoubleOptInReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedDoubleOptInReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is expired`];
    return [];
  }
}

export class BatchedDoubleOptInReviewBatchSizeRangeRule implements BatchedDoubleOptInReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedDoubleOptInReview): string[] {
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

/** Runs every rule of a batched double opt in review. */
export class BatchedDoubleOptInReviewValidator {
  rules: BatchedDoubleOptInReviewRule[];

  constructor(rules: BatchedDoubleOptInReviewRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedDoubleOptInReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedDoubleOptInReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedDoubleOptInReview[]): Map<string, string[]> {
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

export function defaultBatchedDoubleOptInReviewValidator(): BatchedDoubleOptInReviewValidator {
  return new BatchedDoubleOptInReviewValidator(
    [
      new BatchedDoubleOptInReviewAudienceIdLengthRule(255),
      new BatchedDoubleOptInReviewSequenceRangeRule(120, 120),
      new BatchedDoubleOptInReviewRequiredCodeRule("batched double opt in review needs this field"),
      new BatchedDoubleOptInReviewAllowedLocaleRule(["batched"]),
      new BatchedDoubleOptInReviewBatchSizeRangeRule(32, 255),
    ],
  );
}
