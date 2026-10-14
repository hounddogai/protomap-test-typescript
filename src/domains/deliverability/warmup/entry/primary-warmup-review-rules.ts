import { PrimaryWarmupReview } from "./primary-warmup-review.js";

/** A rule a primary warmup review must pass. Check returns its problems, or none. */
export interface PrimaryWarmupReviewRule {
  check(item: PrimaryWarmupReview): string[];
}

export class PrimaryWarmupReviewCodePrefixRule implements PrimaryWarmupReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryWarmupReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryWarmupReviewUnitLengthRule implements PrimaryWarmupReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryWarmupReview): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryWarmupReviewTitleLengthRule implements PrimaryWarmupReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryWarmupReview): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryWarmupReviewSummaryLengthRule implements PrimaryWarmupReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryWarmupReview): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryWarmupReviewRequiredSummaryRule implements PrimaryWarmupReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryWarmupReview): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryWarmupReviewRequiredTitleRule implements PrimaryWarmupReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryWarmupReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary warmup review. */
export class PrimaryWarmupReviewValidator {
  rules: PrimaryWarmupReviewRule[];

  constructor(rules: PrimaryWarmupReviewRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryWarmupReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryWarmupReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryWarmupReview[]): Map<string, string[]> {
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

export function defaultPrimaryWarmupReviewValidator(): PrimaryWarmupReviewValidator {
  return new PrimaryWarmupReviewValidator(
    [
      new PrimaryWarmupReviewCodePrefixRule("X"),
      new PrimaryWarmupReviewUnitLengthRule(16),
      new PrimaryWarmupReviewTitleLengthRule(80),
      new PrimaryWarmupReviewSummaryLengthRule(64),
      new PrimaryWarmupReviewRequiredSummaryRule("primary warmup review needs a value"),
      new PrimaryWarmupReviewRequiredTitleRule("primary warmup review needs a value"),
    ],
  );
}
