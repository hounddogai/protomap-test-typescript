import * as text from "../../../../kit/text.js";
import { FallbackReputationReview } from "./fallback-reputation-review.js";

/** A rule a fallback reputation review must pass. Check returns its problems, or none. */
export interface FallbackReputationReviewRule {
  check(item: FallbackReputationReview): string[];
}

export class FallbackReputationReviewRequiredNameRule implements FallbackReputationReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackReputationReview): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackReputationReviewAllowedNameRule implements FallbackReputationReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackReputationReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is unknown`];
    return [];
  }
}

export class FallbackReputationReviewBidRangeRule implements FallbackReputationReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackReputationReview): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fallback reputation review. */
export class FallbackReputationReviewValidator {
  rules: FallbackReputationReviewRule[];

  constructor(rules: FallbackReputationReviewRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackReputationReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackReputationReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackReputationReview[]): Map<string, string[]> {
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

export function defaultFallbackReputationReviewValidator(): FallbackReputationReviewValidator {
  return new FallbackReputationReviewValidator(
    [
      new FallbackReputationReviewRequiredNameRule("fallback reputation review needs a value"),
      new FallbackReputationReviewAllowedNameRule([]),
      new FallbackReputationReviewBidRangeRule(4.9, 4499.6),
    ],
  );
}
