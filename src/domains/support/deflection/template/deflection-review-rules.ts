import { DeflectionReview } from "./deflection-review.js";

/** A rule a deflection review must pass. Check returns its problems, or none. */
export interface DeflectionReviewRule {
  check(item: DeflectionReview): string[];
}

export class DeflectionReviewCodeLengthRule implements DeflectionReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionReviewRevisionRangeRule implements DeflectionReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionReview): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DeflectionReviewRequiredPhoneRule implements DeflectionReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionReview): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionReviewCodePrefixRule implements DeflectionReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DeflectionReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DeflectionReviewArchivedGuardRule implements DeflectionReviewRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DeflectionReview): string[] {
    if (item.archived && item.revision > this.limit) return [`revision ${item.revision} exceeds ${this.limit} while archived`];
    return [];
  }
}

/** Runs every rule of a deflection review. */
export class DeflectionReviewValidator {
  rules: DeflectionReviewRule[];

  constructor(rules: DeflectionReviewRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionReview): string[] {
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

  requireValid(item: DeflectionReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionReview[]): Map<string, string[]> {
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

export function defaultDeflectionReviewValidator(): DeflectionReviewValidator {
  return new DeflectionReviewValidator(
    [
      new DeflectionReviewCodeLengthRule(16),
      new DeflectionReviewRevisionRangeRule(16, 86400),
      new DeflectionReviewRequiredPhoneRule("deflection review needs a value"),
      new DeflectionReviewCodePrefixRule("ACM"),
      new DeflectionReviewArchivedGuardRule(120),
    ],
  );
}
