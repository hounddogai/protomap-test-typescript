import { FallbackJourneyReview } from "./fallback-journey-review.js";

/** A rule a fallback journey review must pass. Check returns its problems, or none. */
export interface FallbackJourneyReviewRule {
  check(item: FallbackJourneyReview): string[];
}

export class FallbackJourneyReviewChannelLengthRule implements FallbackJourneyReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackJourneyReview): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackJourneyReviewVisibleGuardRule implements FallbackJourneyReviewRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackJourneyReview): string[] {
    if (item.visible && item.durationMinutes > this.limit) return [`duration minutes ${item.durationMinutes} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class FallbackJourneyReviewRequiredNameRule implements FallbackJourneyReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackJourneyReview): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackJourneyReviewCodeLengthRule implements FallbackJourneyReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackJourneyReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback journey review. */
export class FallbackJourneyReviewValidator {
  rules: FallbackJourneyReviewRule[];

  constructor(rules: FallbackJourneyReviewRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackJourneyReview): string[] {
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

  requireValid(item: FallbackJourneyReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackJourneyReview[]): Map<string, string[]> {
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

export function defaultFallbackJourneyReviewValidator(): FallbackJourneyReviewValidator {
  return new FallbackJourneyReviewValidator(
    [
      new FallbackJourneyReviewChannelLengthRule(120),
      new FallbackJourneyReviewVisibleGuardRule(120),
      new FallbackJourneyReviewRequiredNameRule("fallback journey review needs a value"),
      new FallbackJourneyReviewCodeLengthRule(80),
    ],
  );
}
