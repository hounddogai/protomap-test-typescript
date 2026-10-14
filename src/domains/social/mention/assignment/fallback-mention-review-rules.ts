import { FallbackMentionReview } from "./fallback-mention-review.js";

/** A rule a fallback mention review must pass. Check returns its problems, or none. */
export interface FallbackMentionReviewRule {
  check(item: FallbackMentionReview): string[];
}

export class FallbackMentionReviewApprovedGuardRule implements FallbackMentionReviewRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackMentionReview): string[] {
    if (item.approved && item.amount > this.limit) return [`amount ${item.amount} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class FallbackMentionReviewCodePrefixRule implements FallbackMentionReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackMentionReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackMentionReviewCodeLengthRule implements FallbackMentionReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackMentionReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackMentionReviewNameLengthRule implements FallbackMentionReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackMentionReview): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback mention review. */
export class FallbackMentionReviewValidator {
  rules: FallbackMentionReviewRule[];

  constructor(rules: FallbackMentionReviewRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackMentionReview): string[] {
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

  requireValid(item: FallbackMentionReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackMentionReview[]): Map<string, string[]> {
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

export function defaultFallbackMentionReviewValidator(): FallbackMentionReviewValidator {
  return new FallbackMentionReviewValidator(
    [
      new FallbackMentionReviewApprovedGuardRule(4.3),
      new FallbackMentionReviewCodePrefixRule("REF"),
      new FallbackMentionReviewCodeLengthRule(255),
      new FallbackMentionReviewNameLengthRule(86400),
    ],
  );
}
