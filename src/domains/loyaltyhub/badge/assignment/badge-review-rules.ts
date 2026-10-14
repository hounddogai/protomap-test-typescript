import * as text from "../../../../kit/text.js";
import { BadgeReview } from "./badge-review.js";

/** A rule a badge review must pass. Check returns its problems, or none. */
export interface BadgeReviewRule {
  check(item: BadgeReview): string[];
}

export class BadgeReviewAllowedCodeRule implements BadgeReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BadgeReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class BadgeReviewRequiredNameRule implements BadgeReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeReview): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeReviewRequiredCodeRule implements BadgeReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a badge review. */
export class BadgeReviewValidator {
  rules: BadgeReviewRule[];

  constructor(rules: BadgeReviewRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BadgeReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeReview[]): Map<string, string[]> {
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

export function defaultBadgeReviewValidator(): BadgeReviewValidator {
  return new BadgeReviewValidator(
    [
      new BadgeReviewAllowedCodeRule(["strict", "tiered", "seasonal"]),
      new BadgeReviewRequiredNameRule("badge review needs this field"),
      new BadgeReviewRequiredCodeRule("badge review needs this field"),
    ],
  );
}
