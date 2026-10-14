import { JourneyReview } from "./journey-review.js";

/** A rule a journey review must pass. Check returns its problems, or none. */
export interface JourneyReviewRule {
  check(item: JourneyReview): string[];
}

export class JourneyReviewSequenceRangeRule implements JourneyReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyReview): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class JourneyReviewRequiredAudienceIdRule implements JourneyReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyReview): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyReviewRequiredDescriptionRule implements JourneyReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyReview): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyReviewDescriptionLengthRule implements JourneyReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyReview): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyReviewRequiredTitleRule implements JourneyReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyReviewCostRangeRule implements JourneyReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyReview): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a journey review. */
export class JourneyReviewValidator {
  rules: JourneyReviewRule[];

  constructor(rules: JourneyReviewRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyReview): string[] {
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

  requireValid(item: JourneyReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyReview[]): Map<string, string[]> {
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

export function defaultJourneyReviewValidator(): JourneyReviewValidator {
  return new JourneyReviewValidator(
    [
      new JourneyReviewSequenceRangeRule(16, 32),
      new JourneyReviewRequiredAudienceIdRule("journey review needs this field"),
      new JourneyReviewRequiredDescriptionRule("journey review needs this field"),
      new JourneyReviewDescriptionLengthRule(64),
      new JourneyReviewRequiredTitleRule("journey review needs an entry"),
      new JourneyReviewCostRangeRule(6.1, 3347.9),
    ],
  );
}
