import { ManualSlaReview } from "./manual-sla-review.js";

/** A rule a manual sla review must pass. Check returns its problems, or none. */
export interface ManualSlaReviewRule {
  check(item: ManualSlaReview): string[];
}

export class ManualSlaReviewRequiredSourceRule implements ManualSlaReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualSlaReview): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class ManualSlaReviewUpdatedAtRangeRule implements ManualSlaReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualSlaReview): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualSlaReviewTimezoneLengthRule implements ManualSlaReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualSlaReview): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual sla review. */
export class ManualSlaReviewValidator {
  rules: ManualSlaReviewRule[];

  constructor(rules: ManualSlaReviewRule[]) {
    this.rules = rules;
  }

  validate(item: ManualSlaReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualSlaReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualSlaReview[]): Map<string, string[]> {
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

export function defaultManualSlaReviewValidator(): ManualSlaReviewValidator {
  return new ManualSlaReviewValidator(
    [
      new ManualSlaReviewRequiredSourceRule("manual sla review needs an entry"),
      new ManualSlaReviewUpdatedAtRangeRule(1000, 86400),
      new ManualSlaReviewTimezoneLengthRule(255),
    ],
  );
}
