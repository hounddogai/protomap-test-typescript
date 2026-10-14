import { SlaReview } from "./sla-review.js";

/** A rule a sla review must pass. Check returns its problems, or none. */
export interface SlaReviewRule {
  check(item: SlaReview): string[];
}

export class SlaReviewCodeLengthRule implements SlaReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaReviewLabelLengthRule implements SlaReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaReview): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaReviewMinimumRangeRule implements SlaReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaReview): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a sla review. */
export class SlaReviewValidator {
  rules: SlaReviewRule[];

  constructor(rules: SlaReviewRule[]) {
    this.rules = rules;
  }

  validate(item: SlaReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaReview[]): Map<string, string[]> {
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

export function defaultSlaReviewValidator(): SlaReviewValidator {
  return new SlaReviewValidator(
    [
      new SlaReviewCodeLengthRule(3600),
      new SlaReviewLabelLengthRule(3600),
      new SlaReviewMinimumRangeRule(8.4, 1196.4),
    ],
  );
}
