import { RegionalSuppressionReview } from "./regional-suppression-review.js";

/** A rule a regional suppression review must pass. Check returns its problems, or none. */
export interface RegionalSuppressionReviewRule {
  check(item: RegionalSuppressionReview): string[];
}

export class RegionalSuppressionReviewCodeLengthRule implements RegionalSuppressionReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalSuppressionReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalSuppressionReviewRequiredSummaryRule implements RegionalSuppressionReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSuppressionReview): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalSuppressionReviewUpdatedAtRangeRule implements RegionalSuppressionReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSuppressionReview): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a regional suppression review. */
export class RegionalSuppressionReviewValidator {
  rules: RegionalSuppressionReviewRule[];

  constructor(rules: RegionalSuppressionReviewRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalSuppressionReview): string[] {
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

  requireValid(item: RegionalSuppressionReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalSuppressionReview[]): Map<string, string[]> {
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

export function defaultRegionalSuppressionReviewValidator(): RegionalSuppressionReviewValidator {
  return new RegionalSuppressionReviewValidator(
    [
      new RegionalSuppressionReviewCodeLengthRule(32),
      new RegionalSuppressionReviewRequiredSummaryRule("regional suppression review needs this field"),
      new RegionalSuppressionReviewUpdatedAtRangeRule(255, 3600),
    ],
  );
}
