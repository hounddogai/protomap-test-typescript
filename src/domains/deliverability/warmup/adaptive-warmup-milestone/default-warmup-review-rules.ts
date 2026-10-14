import { DefaultWarmupReview } from "./default-warmup-review.js";

/** A rule a default warmup review must pass. Check returns its problems, or none. */
export interface DefaultWarmupReviewRule {
  check(item: DefaultWarmupReview): string[];
}

export class DefaultWarmupReviewLabelLengthRule implements DefaultWarmupReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultWarmupReview): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultWarmupReviewCodeLengthRule implements DefaultWarmupReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultWarmupReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultWarmupReviewExternalRefLengthRule implements DefaultWarmupReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultWarmupReview): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default warmup review. */
export class DefaultWarmupReviewValidator {
  rules: DefaultWarmupReviewRule[];

  constructor(rules: DefaultWarmupReviewRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultWarmupReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultWarmupReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultWarmupReview[]): Map<string, string[]> {
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

export function defaultDefaultWarmupReviewValidator(): DefaultWarmupReviewValidator {
  return new DefaultWarmupReviewValidator(
    [
      new DefaultWarmupReviewLabelLengthRule(80),
      new DefaultWarmupReviewCodeLengthRule(80),
      new DefaultWarmupReviewExternalRefLengthRule(80),
    ],
  );
}
