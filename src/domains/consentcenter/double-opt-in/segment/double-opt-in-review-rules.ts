import { DoubleOptInReview } from "./double-opt-in-review.js";

/** A rule a double opt in review must pass. Check returns its problems, or none. */
export interface DoubleOptInReviewRule {
  check(item: DoubleOptInReview): string[];
}

export class DoubleOptInReviewMarginRangeRule implements DoubleOptInReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInReview): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DoubleOptInReviewRequiredUnitRule implements DoubleOptInReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInReview): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInReviewCodeLengthRule implements DoubleOptInReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInReviewRequiredLabelRule implements DoubleOptInReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInReview): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInReviewJourneyIdLengthRule implements DoubleOptInReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInReview): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a double opt in review. */
export class DoubleOptInReviewValidator {
  rules: DoubleOptInReviewRule[];

  constructor(rules: DoubleOptInReviewRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInReview): string[] {
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

  requireValid(item: DoubleOptInReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInReview[]): Map<string, string[]> {
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

export function defaultDoubleOptInReviewValidator(): DoubleOptInReviewValidator {
  return new DoubleOptInReviewValidator(
    [
      new DoubleOptInReviewMarginRangeRule(3.3, 4813.2),
      new DoubleOptInReviewRequiredUnitRule("double opt in review needs this field"),
      new DoubleOptInReviewCodeLengthRule(255),
      new DoubleOptInReviewRequiredLabelRule("double opt in review needs this field"),
      new DoubleOptInReviewJourneyIdLengthRule(255),
    ],
  );
}
