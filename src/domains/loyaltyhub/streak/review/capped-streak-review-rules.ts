import * as text from "../../../../kit/text.js";
import { CappedStreakReview } from "./capped-streak-review.js";

/** A rule a capped streak review must pass. Check returns its problems, or none. */
export interface CappedStreakReviewRule {
  check(item: CappedStreakReview): string[];
}

export class CappedStreakReviewRequiredAudienceIdRule implements CappedStreakReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedStreakReview): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class CappedStreakReviewUpdatedAtRangeRule implements CappedStreakReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedStreakReview): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedStreakReviewDiscountRangeRule implements CappedStreakReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedStreakReview): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedStreakReviewJourneyIdLengthRule implements CappedStreakReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedStreakReview): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedStreakReviewAllowedAudienceIdRule implements CappedStreakReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedStreakReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a capped streak review. */
export class CappedStreakReviewValidator {
  rules: CappedStreakReviewRule[];

  constructor(rules: CappedStreakReviewRule[]) {
    this.rules = rules;
  }

  validate(item: CappedStreakReview): string[] {
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

  requireValid(item: CappedStreakReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedStreakReview[]): Map<string, string[]> {
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

export function defaultCappedStreakReviewValidator(): CappedStreakReviewValidator {
  return new CappedStreakReviewValidator(
    [
      new CappedStreakReviewRequiredAudienceIdRule("capped streak review needs a value"),
      new CappedStreakReviewUpdatedAtRangeRule(120, 255),
      new CappedStreakReviewDiscountRangeRule(4.6, 2258.7),
      new CappedStreakReviewJourneyIdLengthRule(86400),
      new CappedStreakReviewAllowedAudienceIdRule(["scheduled", "lenient"]),
    ],
  );
}
