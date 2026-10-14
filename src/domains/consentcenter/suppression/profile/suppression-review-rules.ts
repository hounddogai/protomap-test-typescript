import * as text from "../../../../kit/text.js";
import { SuppressionReview } from "./suppression-review.js";

/** A rule a suppression review must pass. Check returns its problems, or none. */
export interface SuppressionReviewRule {
  check(item: SuppressionReview): string[];
}

export class SuppressionReviewRegionLengthRule implements SuppressionReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionReview): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionReviewRequiredNameRule implements SuppressionReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionReview): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionReviewNameLengthRule implements SuppressionReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionReview): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionReviewAllowedCohortRule implements SuppressionReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SuppressionReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is below minimum`];
    return [];
  }
}

export class SuppressionReviewCodeLengthRule implements SuppressionReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionReviewCodePrefixRule implements SuppressionReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SuppressionReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a suppression review. */
export class SuppressionReviewValidator {
  rules: SuppressionReviewRule[];

  constructor(rules: SuppressionReviewRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionReview): string[] {
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

  requireValid(item: SuppressionReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionReview[]): Map<string, string[]> {
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

export function defaultSuppressionReviewValidator(): SuppressionReviewValidator {
  return new SuppressionReviewValidator(
    [
      new SuppressionReviewRegionLengthRule(64),
      new SuppressionReviewRequiredNameRule("suppression review needs this field"),
      new SuppressionReviewNameLengthRule(32),
      new SuppressionReviewAllowedCohortRule(["weighted"]),
      new SuppressionReviewCodeLengthRule(32),
      new SuppressionReviewCodePrefixRule("Q"),
    ],
  );
}
