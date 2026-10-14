import { TieredPostReview } from "./tiered-post-review.js";

/** A rule a tiered post review must pass. Check returns its problems, or none. */
export interface TieredPostReviewRule {
  check(item: TieredPostReview): string[];
}

export class TieredPostReviewLocaleLengthRule implements TieredPostReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPostReview): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredPostReviewRequiredCodeRule implements TieredPostReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPostReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredPostReviewCodePrefixRule implements TieredPostReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredPostReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered post review. */
export class TieredPostReviewValidator {
  rules: TieredPostReviewRule[];

  constructor(rules: TieredPostReviewRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPostReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredPostReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPostReview[]): Map<string, string[]> {
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

export function defaultTieredPostReviewValidator(): TieredPostReviewValidator {
  return new TieredPostReviewValidator(
    [
      new TieredPostReviewLocaleLengthRule(80),
      new TieredPostReviewRequiredCodeRule("tiered post review needs a value"),
      new TieredPostReviewCodePrefixRule("REF"),
    ],
  );
}
