import * as text from "../../../../kit/text.js";
import { PreferenceReview } from "./preference-review.js";

/** A rule a preference review must pass. Check returns its problems, or none. */
export interface PreferenceReviewRule {
  check(item: PreferenceReview): string[];
}

export class PreferenceReviewPinnedGuardRule implements PreferenceReviewRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PreferenceReview): string[] {
    if (item.pinned && item.threshold > this.limit) return [`threshold ${item.threshold} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class PreferenceReviewAllowedTitleRule implements PreferenceReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PreferenceReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is unknown`];
    return [];
  }
}

export class PreferenceReviewTitleLengthRule implements PreferenceReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceReview): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a preference review. */
export class PreferenceReviewValidator {
  rules: PreferenceReviewRule[];

  constructor(rules: PreferenceReviewRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PreferenceReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceReview[]): Map<string, string[]> {
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

export function defaultPreferenceReviewValidator(): PreferenceReviewValidator {
  return new PreferenceReviewValidator(
    [
      new PreferenceReviewPinnedGuardRule(4.3),
      new PreferenceReviewAllowedTitleRule([]),
      new PreferenceReviewTitleLengthRule(3600),
    ],
  );
}
