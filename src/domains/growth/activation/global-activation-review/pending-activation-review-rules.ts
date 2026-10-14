import { PendingActivationReview } from "./pending-activation-review.js";

/** A rule a pending activation review must pass. Check returns its problems, or none. */
export interface PendingActivationReviewRule {
  check(item: PendingActivationReview): string[];
}

export class PendingActivationReviewRequiredCodeRule implements PendingActivationReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingActivationReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingActivationReviewRequiredTitleRule implements PendingActivationReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingActivationReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PendingActivationReviewRateRangeRule implements PendingActivationReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingActivationReview): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingActivationReviewRequiredSegmentRule implements PendingActivationReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingActivationReview): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class PendingActivationReviewBidRangeRule implements PendingActivationReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingActivationReview): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending activation review. */
export class PendingActivationReviewValidator {
  rules: PendingActivationReviewRule[];

  constructor(rules: PendingActivationReviewRule[]) {
    this.rules = rules;
  }

  validate(item: PendingActivationReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingActivationReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingActivationReview[]): Map<string, string[]> {
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

export function defaultPendingActivationReviewValidator(): PendingActivationReviewValidator {
  return new PendingActivationReviewValidator(
    [
      new PendingActivationReviewRequiredCodeRule("pending activation review needs this field"),
      new PendingActivationReviewRequiredTitleRule("pending activation review needs an entry"),
      new PendingActivationReviewRateRangeRule(1.1, 1794.1),
      new PendingActivationReviewRequiredSegmentRule("pending activation review needs an entry"),
      new PendingActivationReviewBidRangeRule(8.5, 3937.4),
    ],
  );
}
