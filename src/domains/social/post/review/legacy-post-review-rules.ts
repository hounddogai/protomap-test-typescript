import { LegacyPostReview } from "./legacy-post-review.js";

/** A rule a legacy post review must pass. Check returns its problems, or none. */
export interface LegacyPostReviewRule {
  check(item: LegacyPostReview): string[];
}

export class LegacyPostReviewCodeLengthRule implements LegacyPostReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPostReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPostReviewCodePrefixRule implements LegacyPostReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyPostReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyPostReviewOpenRateRangeRule implements LegacyPostReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyPostReview): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyPostReviewRateRangeRule implements LegacyPostReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyPostReview): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy post review. */
export class LegacyPostReviewValidator {
  rules: LegacyPostReviewRule[];

  constructor(rules: LegacyPostReviewRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyPostReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyPostReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyPostReview[]): Map<string, string[]> {
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

export function defaultLegacyPostReviewValidator(): LegacyPostReviewValidator {
  return new LegacyPostReviewValidator(
    [
      new LegacyPostReviewCodeLengthRule(255),
      new LegacyPostReviewCodePrefixRule("OPS"),
      new LegacyPostReviewOpenRateRangeRule(3.8, 4115.8),
      new LegacyPostReviewRateRangeRule(2.8, 3596.6),
    ],
  );
}
