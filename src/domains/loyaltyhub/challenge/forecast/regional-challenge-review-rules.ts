import { RegionalChallengeReview } from "./regional-challenge-review.js";

/** A rule a regional challenge review must pass. Check returns its problems, or none. */
export interface RegionalChallengeReviewRule {
  check(item: RegionalChallengeReview): string[];
}

export class RegionalChallengeReviewRequiredTitleRule implements RegionalChallengeReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalChallengeReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalChallengeReviewRequiredCodeRule implements RegionalChallengeReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalChallengeReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalChallengeReviewNotesLengthRule implements RegionalChallengeReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalChallengeReview): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalChallengeReviewRequiredSummaryRule implements RegionalChallengeReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalChallengeReview): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalChallengeReviewCodeLengthRule implements RegionalChallengeReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalChallengeReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalChallengeReviewRequiredNotesRule implements RegionalChallengeReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalChallengeReview): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional challenge review. */
export class RegionalChallengeReviewValidator {
  rules: RegionalChallengeReviewRule[];

  constructor(rules: RegionalChallengeReviewRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalChallengeReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalChallengeReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalChallengeReview[]): Map<string, string[]> {
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

export function defaultRegionalChallengeReviewValidator(): RegionalChallengeReviewValidator {
  return new RegionalChallengeReviewValidator(
    [
      new RegionalChallengeReviewRequiredTitleRule("regional challenge review needs an entry"),
      new RegionalChallengeReviewRequiredCodeRule("regional challenge review needs this field"),
      new RegionalChallengeReviewNotesLengthRule(32),
      new RegionalChallengeReviewRequiredSummaryRule("regional challenge review needs this field"),
      new RegionalChallengeReviewCodeLengthRule(16),
      new RegionalChallengeReviewRequiredNotesRule("regional challenge review needs an entry"),
    ],
  );
}
