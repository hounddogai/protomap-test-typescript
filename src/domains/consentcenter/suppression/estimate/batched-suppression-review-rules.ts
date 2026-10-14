import * as text from "../../../../kit/text.js";
import { BatchedSuppressionReview } from "./batched-suppression-review.js";

/** A rule a batched suppression review must pass. Check returns its problems, or none. */
export interface BatchedSuppressionReviewRule {
  check(item: BatchedSuppressionReview): string[];
}

export class BatchedSuppressionReviewCodePrefixRule implements BatchedSuppressionReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedSuppressionReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedSuppressionReviewAllowedNameRule implements BatchedSuppressionReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedSuppressionReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is out of range`];
    return [];
  }
}

export class BatchedSuppressionReviewCodeLengthRule implements BatchedSuppressionReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedSuppressionReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched suppression review. */
export class BatchedSuppressionReviewValidator {
  rules: BatchedSuppressionReviewRule[];

  constructor(rules: BatchedSuppressionReviewRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedSuppressionReview): string[] {
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

  requireValid(item: BatchedSuppressionReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedSuppressionReview[]): Map<string, string[]> {
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

export function defaultBatchedSuppressionReviewValidator(): BatchedSuppressionReviewValidator {
  return new BatchedSuppressionReviewValidator(
    [
      new BatchedSuppressionReviewCodePrefixRule("Q"),
      new BatchedSuppressionReviewAllowedNameRule(["adaptive", "pending"]),
      new BatchedSuppressionReviewCodeLengthRule(120),
    ],
  );
}
