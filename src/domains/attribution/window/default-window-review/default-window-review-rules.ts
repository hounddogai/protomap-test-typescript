import { DefaultWindowReview } from "./default-window-review.js";

/** A rule a default window review must pass. Check returns its problems, or none. */
export interface DefaultWindowReviewRule {
  check(item: DefaultWindowReview): string[];
}

export class DefaultWindowReviewDiscountRangeRule implements DefaultWindowReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultWindowReview): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultWindowReviewLocaleLengthRule implements DefaultWindowReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultWindowReview): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultWindowReviewRequiredTitleRule implements DefaultWindowReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultWindowReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultWindowReviewCeilingRangeRule implements DefaultWindowReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultWindowReview): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a default window review. */
export class DefaultWindowReviewValidator {
  rules: DefaultWindowReviewRule[];

  constructor(rules: DefaultWindowReviewRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultWindowReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultWindowReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultWindowReview[]): Map<string, string[]> {
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

export function defaultDefaultWindowReviewValidator(): DefaultWindowReviewValidator {
  return new DefaultWindowReviewValidator(
    [
      new DefaultWindowReviewDiscountRangeRule(6.4, 4083.4),
      new DefaultWindowReviewLocaleLengthRule(64),
      new DefaultWindowReviewRequiredTitleRule("default window review needs an entry"),
      new DefaultWindowReviewCeilingRangeRule(0.7, 2108),
    ],
  );
}
