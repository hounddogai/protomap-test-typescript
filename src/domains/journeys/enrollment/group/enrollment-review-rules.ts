import { EnrollmentReview } from "./enrollment-review.js";

/** A rule a enrollment review must pass. Check returns its problems, or none. */
export interface EnrollmentReviewRule {
  check(item: EnrollmentReview): string[];
}

export class EnrollmentReviewRequiredLabelRule implements EnrollmentReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentReview): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentReviewRequiredLocaleRule implements EnrollmentReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentReview): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentReviewAmountRangeRule implements EnrollmentReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentReview): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a enrollment review. */
export class EnrollmentReviewValidator {
  rules: EnrollmentReviewRule[];

  constructor(rules: EnrollmentReviewRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EnrollmentReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentReview[]): Map<string, string[]> {
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

export function defaultEnrollmentReviewValidator(): EnrollmentReviewValidator {
  return new EnrollmentReviewValidator(
    [
      new EnrollmentReviewRequiredLabelRule("enrollment review needs this field"),
      new EnrollmentReviewRequiredLocaleRule("enrollment review needs this field"),
      new EnrollmentReviewAmountRangeRule(6.5, 4450.1),
    ],
  );
}
