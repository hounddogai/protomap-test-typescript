import * as text from "../../../../kit/text.js";
import { SeasonalSenderReview } from "./seasonal-sender-review.js";

/** A rule a seasonal sender review must pass. Check returns its problems, or none. */
export interface SeasonalSenderReviewRule {
  check(item: SeasonalSenderReview): string[];
}

export class SeasonalSenderReviewAllowedCodeRule implements SeasonalSenderReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalSenderReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class SeasonalSenderReviewCodeLengthRule implements SeasonalSenderReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalSenderReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalSenderReviewSegmentLengthRule implements SeasonalSenderReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalSenderReview): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalSenderReviewTitleLengthRule implements SeasonalSenderReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalSenderReview): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalSenderReviewCodePrefixRule implements SeasonalSenderReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalSenderReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalSenderReviewRequiredTitleRule implements SeasonalSenderReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalSenderReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal sender review. */
export class SeasonalSenderReviewValidator {
  rules: SeasonalSenderReviewRule[];

  constructor(rules: SeasonalSenderReviewRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalSenderReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalSenderReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalSenderReview[]): Map<string, string[]> {
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

export function defaultSeasonalSenderReviewValidator(): SeasonalSenderReviewValidator {
  return new SeasonalSenderReviewValidator(
    [
      new SeasonalSenderReviewAllowedCodeRule([]),
      new SeasonalSenderReviewCodeLengthRule(255),
      new SeasonalSenderReviewSegmentLengthRule(16),
      new SeasonalSenderReviewTitleLengthRule(16),
      new SeasonalSenderReviewCodePrefixRule("ACM"),
      new SeasonalSenderReviewRequiredTitleRule("seasonal sender review needs a value"),
    ],
  );
}
