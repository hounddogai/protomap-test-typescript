import { BatchedMentionReview } from "./batched-mention-review.js";

/** A rule a batched mention review must pass. Check returns its problems, or none. */
export interface BatchedMentionReviewRule {
  check(item: BatchedMentionReview): string[];
}

export class BatchedMentionReviewRequiredCodeRule implements BatchedMentionReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedMentionReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedMentionReviewFrequencyCapRangeRule implements BatchedMentionReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedMentionReview): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedMentionReviewRequiredPhoneRule implements BatchedMentionReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedMentionReview): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedMentionReviewCodePrefixRule implements BatchedMentionReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedMentionReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedMentionReviewTitleLengthRule implements BatchedMentionReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedMentionReview): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedMentionReviewSourceLengthRule implements BatchedMentionReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedMentionReview): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched mention review. */
export class BatchedMentionReviewValidator {
  rules: BatchedMentionReviewRule[];

  constructor(rules: BatchedMentionReviewRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedMentionReview): string[] {
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

  requireValid(item: BatchedMentionReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedMentionReview[]): Map<string, string[]> {
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

export function defaultBatchedMentionReviewValidator(): BatchedMentionReviewValidator {
  return new BatchedMentionReviewValidator(
    [
      new BatchedMentionReviewRequiredCodeRule("batched mention review needs this field"),
      new BatchedMentionReviewFrequencyCapRangeRule(80, 3600),
      new BatchedMentionReviewRequiredPhoneRule("batched mention review needs this field"),
      new BatchedMentionReviewCodePrefixRule("Q"),
      new BatchedMentionReviewTitleLengthRule(64),
      new BatchedMentionReviewSourceLengthRule(120),
    ],
  );
}
