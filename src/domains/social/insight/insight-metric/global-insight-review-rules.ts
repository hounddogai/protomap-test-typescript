import * as text from "../../../../kit/text.js";
import { GlobalInsightReview } from "./global-insight-review.js";

/** A rule a global insight review must pass. Check returns its problems, or none. */
export interface GlobalInsightReviewRule {
  check(item: GlobalInsightReview): string[];
}

export class GlobalInsightReviewAllowedCodeRule implements GlobalInsightReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalInsightReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class GlobalInsightReviewRequiredCodeRule implements GlobalInsightReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalInsightReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalInsightReviewStartsAtRangeRule implements GlobalInsightReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalInsightReview): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a global insight review. */
export class GlobalInsightReviewValidator {
  rules: GlobalInsightReviewRule[];

  constructor(rules: GlobalInsightReviewRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalInsightReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalInsightReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalInsightReview[]): Map<string, string[]> {
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

export function defaultGlobalInsightReviewValidator(): GlobalInsightReviewValidator {
  return new GlobalInsightReviewValidator(
    [
      new GlobalInsightReviewAllowedCodeRule(["global", "batched", "batched"]),
      new GlobalInsightReviewRequiredCodeRule("global insight review needs this field"),
      new GlobalInsightReviewStartsAtRangeRule(255, 86400),
    ],
  );
}
