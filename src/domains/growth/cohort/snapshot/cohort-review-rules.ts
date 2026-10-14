import { CohortReview } from "./cohort-review.js";

/** A rule a cohort review must pass. Check returns its problems, or none. */
export interface CohortReviewRule {
  check(item: CohortReview): string[];
}

export class CohortReviewRequiredNameRule implements CohortReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortReview): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CohortReviewBatchSizeRangeRule implements CohortReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortReview): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CohortReviewCodeLengthRule implements CohortReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortReviewRequiredSegmentRule implements CohortReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortReview): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a cohort review. */
export class CohortReviewValidator {
  rules: CohortReviewRule[];

  constructor(rules: CohortReviewRule[]) {
    this.rules = rules;
  }

  validate(item: CohortReview): string[] {
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

  requireValid(item: CohortReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortReview[]): Map<string, string[]> {
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

export function defaultCohortReviewValidator(): CohortReviewValidator {
  return new CohortReviewValidator(
    [
      new CohortReviewRequiredNameRule("cohort review needs an entry"),
      new CohortReviewBatchSizeRangeRule(16, 64),
      new CohortReviewCodeLengthRule(32),
      new CohortReviewRequiredSegmentRule("cohort review needs an entry"),
    ],
  );
}
