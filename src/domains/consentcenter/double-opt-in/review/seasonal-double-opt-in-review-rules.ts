import { SeasonalDoubleOptInReview } from "./seasonal-double-opt-in-review.js";

/** A rule a seasonal double opt in review must pass. Check returns its problems, or none. */
export interface SeasonalDoubleOptInReviewRule {
  check(item: SeasonalDoubleOptInReview): string[];
}

export class SeasonalDoubleOptInReviewCountryLengthRule implements SeasonalDoubleOptInReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalDoubleOptInReview): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalDoubleOptInReviewRequiredLabelRule implements SeasonalDoubleOptInReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalDoubleOptInReview): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalDoubleOptInReviewRequiredCodeRule implements SeasonalDoubleOptInReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalDoubleOptInReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalDoubleOptInReviewRequiredCountryRule implements SeasonalDoubleOptInReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalDoubleOptInReview): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal double opt in review. */
export class SeasonalDoubleOptInReviewValidator {
  rules: SeasonalDoubleOptInReviewRule[];

  constructor(rules: SeasonalDoubleOptInReviewRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalDoubleOptInReview): string[] {
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

  requireValid(item: SeasonalDoubleOptInReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalDoubleOptInReview[]): Map<string, string[]> {
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

export function defaultSeasonalDoubleOptInReviewValidator(): SeasonalDoubleOptInReviewValidator {
  return new SeasonalDoubleOptInReviewValidator(
    [
      new SeasonalDoubleOptInReviewCountryLengthRule(1000),
      new SeasonalDoubleOptInReviewRequiredLabelRule("seasonal double opt in review needs this field"),
      new SeasonalDoubleOptInReviewRequiredCodeRule("seasonal double opt in review needs a value"),
      new SeasonalDoubleOptInReviewRequiredCountryRule("seasonal double opt in review needs a value"),
    ],
  );
}
