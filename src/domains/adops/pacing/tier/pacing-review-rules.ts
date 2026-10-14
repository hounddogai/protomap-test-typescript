import * as text from "../../../../kit/text.js";
import { PacingReview } from "./pacing-review.js";

/** A rule a pacing review must pass. Check returns its problems, or none. */
export interface PacingReviewRule {
  check(item: PacingReview): string[];
}

export class PacingReviewCodePrefixRule implements PacingReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PacingReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PacingReviewWindowDaysRangeRule implements PacingReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingReview): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PacingReviewChannelLengthRule implements PacingReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingReview): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingReviewAllowedJourneyIdRule implements PacingReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PacingReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is below minimum`];
    return [];
  }
}

/** Runs every rule of a pacing review. */
export class PacingReviewValidator {
  rules: PacingReviewRule[];

  constructor(rules: PacingReviewRule[]) {
    this.rules = rules;
  }

  validate(item: PacingReview): string[] {
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

  requireValid(item: PacingReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingReview[]): Map<string, string[]> {
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

export function defaultPacingReviewValidator(): PacingReviewValidator {
  return new PacingReviewValidator(
    [
      new PacingReviewCodePrefixRule("REF"),
      new PacingReviewWindowDaysRangeRule(16, 80),
      new PacingReviewChannelLengthRule(86400),
      new PacingReviewAllowedJourneyIdRule([]),
    ],
  );
}
