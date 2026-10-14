import { CsatReview } from "./csat-review.js";

/** A rule a csat review must pass. Check returns its problems, or none. */
export interface CsatReviewRule {
  check(item: CsatReview): string[];
}

export class CsatReviewRequiredLabelRule implements CsatReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatReview): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CsatReviewBudgetRangeRule implements CsatReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatReview): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CsatReviewAttemptsRangeRule implements CsatReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatReview): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CsatReviewCodeLengthRule implements CsatReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatReviewCategoryLengthRule implements CsatReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatReview): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a csat review. */
export class CsatReviewValidator {
  rules: CsatReviewRule[];

  constructor(rules: CsatReviewRule[]) {
    this.rules = rules;
  }

  validate(item: CsatReview): string[] {
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

  requireValid(item: CsatReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatReview[]): Map<string, string[]> {
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

export function defaultCsatReviewValidator(): CsatReviewValidator {
  return new CsatReviewValidator(
    [
      new CsatReviewRequiredLabelRule("csat review needs an entry"),
      new CsatReviewBudgetRangeRule(7, 1627.4),
      new CsatReviewAttemptsRangeRule(255, 255),
      new CsatReviewCodeLengthRule(16),
      new CsatReviewCategoryLengthRule(32),
    ],
  );
}
