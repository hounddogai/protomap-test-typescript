import * as text from "../../../../kit/text.js";
import { LenientWarmupReview } from "./lenient-warmup-review.js";

/** A rule a lenient warmup review must pass. Check returns its problems, or none. */
export interface LenientWarmupReviewRule {
  check(item: LenientWarmupReview): string[];
}

export class LenientWarmupReviewAllowedOwnerIdRule implements LenientWarmupReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientWarmupReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is blocked`];
    return [];
  }
}

export class LenientWarmupReviewRequiredLabelRule implements LenientWarmupReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientWarmupReview): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LenientWarmupReviewCodePrefixRule implements LenientWarmupReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientWarmupReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientWarmupReviewRequiredLocaleRule implements LenientWarmupReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientWarmupReview): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient warmup review. */
export class LenientWarmupReviewValidator {
  rules: LenientWarmupReviewRule[];

  constructor(rules: LenientWarmupReviewRule[]) {
    this.rules = rules;
  }

  validate(item: LenientWarmupReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientWarmupReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientWarmupReview[]): Map<string, string[]> {
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

export function defaultLenientWarmupReviewValidator(): LenientWarmupReviewValidator {
  return new LenientWarmupReviewValidator(
    [
      new LenientWarmupReviewAllowedOwnerIdRule(["batched", "primary", "scheduled"]),
      new LenientWarmupReviewRequiredLabelRule("lenient warmup review needs an entry"),
      new LenientWarmupReviewCodePrefixRule("ACM"),
      new LenientWarmupReviewRequiredLocaleRule("lenient warmup review needs a value"),
    ],
  );
}
