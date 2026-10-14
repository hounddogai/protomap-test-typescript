import { LenientComplaintReview } from "./lenient-complaint-review.js";

/** A rule a lenient complaint review must pass. Check returns its problems, or none. */
export interface LenientComplaintReviewRule {
  check(item: LenientComplaintReview): string[];
}

export class LenientComplaintReviewEndsAtRangeRule implements LenientComplaintReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientComplaintReview): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientComplaintReviewTitleLengthRule implements LenientComplaintReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientComplaintReview): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientComplaintReviewRequiredLocaleRule implements LenientComplaintReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientComplaintReview): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class LenientComplaintReviewMinimumRangeRule implements LenientComplaintReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientComplaintReview): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientComplaintReviewRequiredCodeRule implements LenientComplaintReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientComplaintReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient complaint review. */
export class LenientComplaintReviewValidator {
  rules: LenientComplaintReviewRule[];

  constructor(rules: LenientComplaintReviewRule[]) {
    this.rules = rules;
  }

  validate(item: LenientComplaintReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientComplaintReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientComplaintReview[]): Map<string, string[]> {
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

export function defaultLenientComplaintReviewValidator(): LenientComplaintReviewValidator {
  return new LenientComplaintReviewValidator(
    [
      new LenientComplaintReviewEndsAtRangeRule(32, 1000),
      new LenientComplaintReviewTitleLengthRule(255),
      new LenientComplaintReviewRequiredLocaleRule("lenient complaint review needs a value"),
      new LenientComplaintReviewMinimumRangeRule(4.5, 4155.3),
      new LenientComplaintReviewRequiredCodeRule("lenient complaint review needs this field"),
    ],
  );
}
