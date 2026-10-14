import { ManualMentionReview } from "./manual-mention-review.js";

/** A rule a manual mention review must pass. Check returns its problems, or none. */
export interface ManualMentionReviewRule {
  check(item: ManualMentionReview): string[];
}

export class ManualMentionReviewBatchSizeRangeRule implements ManualMentionReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualMentionReview): string[] {
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

export class ManualMentionReviewRateRangeRule implements ManualMentionReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualMentionReview): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualMentionReviewMinimumRangeRule implements ManualMentionReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualMentionReview): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualMentionReviewLabelLengthRule implements ManualMentionReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualMentionReview): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual mention review. */
export class ManualMentionReviewValidator {
  rules: ManualMentionReviewRule[];

  constructor(rules: ManualMentionReviewRule[]) {
    this.rules = rules;
  }

  validate(item: ManualMentionReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualMentionReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualMentionReview[]): Map<string, string[]> {
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

export function defaultManualMentionReviewValidator(): ManualMentionReviewValidator {
  return new ManualMentionReviewValidator(
    [
      new ManualMentionReviewBatchSizeRangeRule(120, 120),
      new ManualMentionReviewRateRangeRule(1.9, 3534.1),
      new ManualMentionReviewMinimumRangeRule(10, 1137.4),
      new ManualMentionReviewLabelLengthRule(1000),
    ],
  );
}
