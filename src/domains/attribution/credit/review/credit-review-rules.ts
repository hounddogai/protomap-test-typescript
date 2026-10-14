import * as text from "../../../../kit/text.js";
import { CreditReview } from "./credit-review.js";

/** A rule a credit review must pass. Check returns its problems, or none. */
export interface CreditReviewRule {
  check(item: CreditReview): string[];
}

export class CreditReviewRetriesRangeRule implements CreditReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditReview): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreditReviewRequiredLabelRule implements CreditReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditReview): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CreditReviewRequiredVariantRule implements CreditReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditReview): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class CreditReviewQuantityRangeRule implements CreditReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditReview): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreditReviewAllowedCodeRule implements CreditReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class CreditReviewVariantLengthRule implements CreditReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditReview): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a credit review. */
export class CreditReviewValidator {
  rules: CreditReviewRule[];

  constructor(rules: CreditReviewRule[]) {
    this.rules = rules;
  }

  validate(item: CreditReview): string[] {
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

  requireValid(item: CreditReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditReview[]): Map<string, string[]> {
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

export function defaultCreditReviewValidator(): CreditReviewValidator {
  return new CreditReviewValidator(
    [
      new CreditReviewRetriesRangeRule(64, 120),
      new CreditReviewRequiredLabelRule("credit review needs an entry"),
      new CreditReviewRequiredVariantRule("credit review needs this field"),
      new CreditReviewQuantityRangeRule(16, 80),
      new CreditReviewAllowedCodeRule(["fallback"]),
      new CreditReviewVariantLengthRule(64),
    ],
  );
}
