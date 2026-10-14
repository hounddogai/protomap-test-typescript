import * as text from "../../../../kit/text.js";
import { PathReview } from "./path-review.js";

/** A rule a path review must pass. Check returns its problems, or none. */
export interface PathReviewRule {
  check(item: PathReview): string[];
}

export class PathReviewRequiredLocaleRule implements PathReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathReview): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class PathReviewDescriptionLengthRule implements PathReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathReview): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathReviewBatchSizeRangeRule implements PathReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathReview): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PathReviewAllowedDescriptionRule implements PathReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PathReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is duplicated`];
    return [];
  }
}

/** Runs every rule of a path review. */
export class PathReviewValidator {
  rules: PathReviewRule[];

  constructor(rules: PathReviewRule[]) {
    this.rules = rules;
  }

  validate(item: PathReview): string[] {
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

  requireValid(item: PathReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathReview[]): Map<string, string[]> {
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

export function defaultPathReviewValidator(): PathReviewValidator {
  return new PathReviewValidator(
    [
      new PathReviewRequiredLocaleRule("path review needs an entry"),
      new PathReviewDescriptionLengthRule(32),
      new PathReviewBatchSizeRangeRule(32, 3600),
      new PathReviewAllowedDescriptionRule(["default", "capped", "seasonal"]),
    ],
  );
}
