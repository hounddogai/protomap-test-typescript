import * as text from "../../../../kit/text.js";
import { PostReview } from "./post-review.js";

/** A rule a post review must pass. Check returns its problems, or none. */
export interface PostReviewRule {
  check(item: PostReview): string[];
}

export class PostReviewAllowedRegionRule implements PostReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PostReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is below minimum`];
    return [];
  }
}

export class PostReviewRequiredOwnerIdRule implements PostReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostReview): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class PostReviewLabelLengthRule implements PostReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostReview): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostReviewOwnerIdLengthRule implements PostReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostReview): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a post review. */
export class PostReviewValidator {
  rules: PostReviewRule[];

  constructor(rules: PostReviewRule[]) {
    this.rules = rules;
  }

  validate(item: PostReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PostReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostReview[]): Map<string, string[]> {
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

export function defaultPostReviewValidator(): PostReviewValidator {
  return new PostReviewValidator(
    [
      new PostReviewAllowedRegionRule(["batched"]),
      new PostReviewRequiredOwnerIdRule("post review needs an entry"),
      new PostReviewLabelLengthRule(86400),
      new PostReviewOwnerIdLengthRule(32),
    ],
  );
}
