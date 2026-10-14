import { ChallengeReview } from "./challenge-review.js";

/** A rule a challenge review must pass. Check returns its problems, or none. */
export interface ChallengeReviewRule {
  check(item: ChallengeReview): string[];
}

export class ChallengeReviewCodePrefixRule implements ChallengeReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ChallengeReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ChallengeReviewNameLengthRule implements ChallengeReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeReview): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeReviewRequiredCohortRule implements ChallengeReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeReview): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeReviewImpressionsRangeRule implements ChallengeReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeReview): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ChallengeReviewPriorityRangeRule implements ChallengeReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeReview): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a challenge review. */
export class ChallengeReviewValidator {
  rules: ChallengeReviewRule[];

  constructor(rules: ChallengeReviewRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ChallengeReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeReview[]): Map<string, string[]> {
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

export function defaultChallengeReviewValidator(): ChallengeReviewValidator {
  return new ChallengeReviewValidator(
    [
      new ChallengeReviewCodePrefixRule("ACM"),
      new ChallengeReviewNameLengthRule(64),
      new ChallengeReviewRequiredCohortRule("challenge review needs this field"),
      new ChallengeReviewImpressionsRangeRule(64, 1000),
      new ChallengeReviewPriorityRangeRule(64, 1000),
    ],
  );
}
