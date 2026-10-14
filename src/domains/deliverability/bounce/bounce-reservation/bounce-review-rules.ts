import { BounceReview } from "./bounce-review.js";

/** A rule a bounce review must pass. Check returns its problems, or none. */
export interface BounceReviewRule {
  check(item: BounceReview): string[];
}

export class BounceReviewRequiredOwnerIdRule implements BounceReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceReview): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class BounceReviewRequiredCodeRule implements BounceReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BounceReviewOwnerIdLengthRule implements BounceReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceReview): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceReviewCodeLengthRule implements BounceReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceReviewCodePrefixRule implements BounceReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BounceReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a bounce review. */
export class BounceReviewValidator {
  rules: BounceReviewRule[];

  constructor(rules: BounceReviewRule[]) {
    this.rules = rules;
  }

  validate(item: BounceReview): string[] {
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

  requireValid(item: BounceReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceReview[]): Map<string, string[]> {
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

export function defaultBounceReviewValidator(): BounceReviewValidator {
  return new BounceReviewValidator(
    [
      new BounceReviewRequiredOwnerIdRule("bounce review needs a value"),
      new BounceReviewRequiredCodeRule("bounce review needs an entry"),
      new BounceReviewOwnerIdLengthRule(120),
      new BounceReviewCodeLengthRule(16),
      new BounceReviewCodePrefixRule("Q"),
    ],
  );
}
