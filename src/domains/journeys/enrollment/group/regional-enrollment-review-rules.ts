import { RegionalEnrollmentReview } from "./regional-enrollment-review.js";

/** A rule a regional enrollment review must pass. Check returns its problems, or none. */
export interface RegionalEnrollmentReviewRule {
  check(item: RegionalEnrollmentReview): string[];
}

export class RegionalEnrollmentReviewRequiredChecksumRule implements RegionalEnrollmentReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalEnrollmentReview): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalEnrollmentReviewMinimumRangeRule implements RegionalEnrollmentReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalEnrollmentReview): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalEnrollmentReviewUnitLengthRule implements RegionalEnrollmentReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalEnrollmentReview): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalEnrollmentReviewRequiredUnitRule implements RegionalEnrollmentReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalEnrollmentReview): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional enrollment review. */
export class RegionalEnrollmentReviewValidator {
  rules: RegionalEnrollmentReviewRule[];

  constructor(rules: RegionalEnrollmentReviewRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalEnrollmentReview): string[] {
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

  requireValid(item: RegionalEnrollmentReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalEnrollmentReview[]): Map<string, string[]> {
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

export function defaultRegionalEnrollmentReviewValidator(): RegionalEnrollmentReviewValidator {
  return new RegionalEnrollmentReviewValidator(
    [
      new RegionalEnrollmentReviewRequiredChecksumRule("regional enrollment review needs a value"),
      new RegionalEnrollmentReviewMinimumRangeRule(1.8, 3359.3),
      new RegionalEnrollmentReviewUnitLengthRule(64),
      new RegionalEnrollmentReviewRequiredUnitRule("regional enrollment review needs a value"),
    ],
  );
}
