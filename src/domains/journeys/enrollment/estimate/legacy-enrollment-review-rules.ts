import { LegacyEnrollmentReview } from "./legacy-enrollment-review.js";

/** A rule a legacy enrollment review must pass. Check returns its problems, or none. */
export interface LegacyEnrollmentReviewRule {
  check(item: LegacyEnrollmentReview): string[];
}

export class LegacyEnrollmentReviewRequiredCurrencyRule implements LegacyEnrollmentReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyEnrollmentReview): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyEnrollmentReviewLabelLengthRule implements LegacyEnrollmentReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyEnrollmentReview): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyEnrollmentReviewImpressionsRangeRule implements LegacyEnrollmentReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyEnrollmentReview): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyEnrollmentReviewCodeLengthRule implements LegacyEnrollmentReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyEnrollmentReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyEnrollmentReviewRequiredLabelRule implements LegacyEnrollmentReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyEnrollmentReview): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy enrollment review. */
export class LegacyEnrollmentReviewValidator {
  rules: LegacyEnrollmentReviewRule[];

  constructor(rules: LegacyEnrollmentReviewRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyEnrollmentReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyEnrollmentReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyEnrollmentReview[]): Map<string, string[]> {
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

export function defaultLegacyEnrollmentReviewValidator(): LegacyEnrollmentReviewValidator {
  return new LegacyEnrollmentReviewValidator(
    [
      new LegacyEnrollmentReviewRequiredCurrencyRule("legacy enrollment review needs this field"),
      new LegacyEnrollmentReviewLabelLengthRule(120),
      new LegacyEnrollmentReviewImpressionsRangeRule(32, 86400),
      new LegacyEnrollmentReviewCodeLengthRule(80),
      new LegacyEnrollmentReviewRequiredLabelRule("legacy enrollment review needs a value"),
    ],
  );
}
