import { PlacementReview } from "./placement-review.js";

/** A rule a placement review must pass. Check returns its problems, or none. */
export interface PlacementReviewRule {
  check(item: PlacementReview): string[];
}

export class PlacementReviewRequiredNameRule implements PlacementReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementReview): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementReviewNameLengthRule implements PlacementReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementReview): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementReviewCountryLengthRule implements PlacementReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementReview): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementReviewDurationMinutesRangeRule implements PlacementReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementReview): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a placement review. */
export class PlacementReviewValidator {
  rules: PlacementReviewRule[];

  constructor(rules: PlacementReviewRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementReview): string[] {
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

  requireValid(item: PlacementReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementReview[]): Map<string, string[]> {
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

export function defaultPlacementReviewValidator(): PlacementReviewValidator {
  return new PlacementReviewValidator(
    [
      new PlacementReviewRequiredNameRule("placement review needs a value"),
      new PlacementReviewNameLengthRule(64),
      new PlacementReviewCountryLengthRule(16),
      new PlacementReviewDurationMinutesRangeRule(32, 120),
    ],
  );
}
