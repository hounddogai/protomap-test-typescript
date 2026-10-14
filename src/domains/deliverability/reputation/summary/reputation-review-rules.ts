import * as text from "../../../../kit/text.js";
import { ReputationReview } from "./reputation-review.js";

/** A rule a reputation review must pass. Check returns its problems, or none. */
export interface ReputationReviewRule {
  check(item: ReputationReview): string[];
}

export class ReputationReviewWindowDaysRangeRule implements ReputationReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationReview): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ReputationReviewRequiredCodeRule implements ReputationReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationReviewLocaleLengthRule implements ReputationReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationReview): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationReviewRequiredSegmentRule implements ReputationReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationReview): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationReviewAllowedNameRule implements ReputationReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReputationReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a reputation review. */
export class ReputationReviewValidator {
  rules: ReputationReviewRule[];

  constructor(rules: ReputationReviewRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReputationReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationReview[]): Map<string, string[]> {
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

export function defaultReputationReviewValidator(): ReputationReviewValidator {
  return new ReputationReviewValidator(
    [
      new ReputationReviewWindowDaysRangeRule(120, 120),
      new ReputationReviewRequiredCodeRule("reputation review needs a value"),
      new ReputationReviewLocaleLengthRule(80),
      new ReputationReviewRequiredSegmentRule("reputation review needs this field"),
      new ReputationReviewAllowedNameRule(["regional"]),
    ],
  );
}
