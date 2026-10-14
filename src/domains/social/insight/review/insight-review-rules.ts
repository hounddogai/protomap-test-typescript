import * as text from "../../../../kit/text.js";
import { InsightReview } from "./insight-review.js";

/** A rule a insight review must pass. Check returns its problems, or none. */
export interface InsightReviewRule {
  check(item: InsightReview): string[];
}

export class InsightReviewCodePrefixRule implements InsightReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InsightReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class InsightReviewRequiredTitleRule implements InsightReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class InsightReviewAllowedTitleRule implements InsightReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InsightReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is out of range`];
    return [];
  }
}

export class InsightReviewWindowDaysRangeRule implements InsightReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightReview): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InsightReviewRequiredCohortRule implements InsightReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightReview): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a insight review. */
export class InsightReviewValidator {
  rules: InsightReviewRule[];

  constructor(rules: InsightReviewRule[]) {
    this.rules = rules;
  }

  validate(item: InsightReview): string[] {
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

  requireValid(item: InsightReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightReview[]): Map<string, string[]> {
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

export function defaultInsightReviewValidator(): InsightReviewValidator {
  return new InsightReviewValidator(
    [
      new InsightReviewCodePrefixRule("OPS"),
      new InsightReviewRequiredTitleRule("insight review needs a value"),
      new InsightReviewAllowedTitleRule(["weighted"]),
      new InsightReviewWindowDaysRangeRule(120, 255),
      new InsightReviewRequiredCohortRule("insight review needs an entry"),
    ],
  );
}
