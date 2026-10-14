import { ScheduledMentionReview } from "./scheduled-mention-review.js";

/** A rule a scheduled mention review must pass. Check returns its problems, or none. */
export interface ScheduledMentionReviewRule {
  check(item: ScheduledMentionReview): string[];
}

export class ScheduledMentionReviewRequiredTimezoneRule implements ScheduledMentionReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledMentionReview): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledMentionReviewTimezoneLengthRule implements ScheduledMentionReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledMentionReview): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledMentionReviewRequiredCurrencyRule implements ScheduledMentionReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledMentionReview): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledMentionReviewCurrencyLengthRule implements ScheduledMentionReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledMentionReview): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled mention review. */
export class ScheduledMentionReviewValidator {
  rules: ScheduledMentionReviewRule[];

  constructor(rules: ScheduledMentionReviewRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledMentionReview): string[] {
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

  requireValid(item: ScheduledMentionReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledMentionReview[]): Map<string, string[]> {
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

export function defaultScheduledMentionReviewValidator(): ScheduledMentionReviewValidator {
  return new ScheduledMentionReviewValidator(
    [
      new ScheduledMentionReviewRequiredTimezoneRule("scheduled mention review needs this field"),
      new ScheduledMentionReviewTimezoneLengthRule(16),
      new ScheduledMentionReviewRequiredCurrencyRule("scheduled mention review needs a value"),
      new ScheduledMentionReviewCurrencyLengthRule(255),
    ],
  );
}
