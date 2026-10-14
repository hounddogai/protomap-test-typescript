import * as text from "../../../../kit/text.js";
import { PrimaryExitRuleReview } from "./primary-exit-rule-review.js";

/** A rule a primary exit rule review must pass. Check returns its problems, or none. */
export interface PrimaryExitRuleReviewRule {
  check(item: PrimaryExitRuleReview): string[];
}

export class PrimaryExitRuleReviewNameLengthRule implements PrimaryExitRuleReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryExitRuleReview): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryExitRuleReviewRequiredNameRule implements PrimaryExitRuleReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryExitRuleReview): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryExitRuleReviewOwnerIdLengthRule implements PrimaryExitRuleReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryExitRuleReview): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryExitRuleReviewCeilingRangeRule implements PrimaryExitRuleReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryExitRuleReview): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryExitRuleReviewRatioRangeRule implements PrimaryExitRuleReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryExitRuleReview): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryExitRuleReviewAllowedCodeRule implements PrimaryExitRuleReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryExitRuleReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

/** Runs every rule of a primary exit rule review. */
export class PrimaryExitRuleReviewValidator {
  rules: PrimaryExitRuleReviewRule[];

  constructor(rules: PrimaryExitRuleReviewRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryExitRuleReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryExitRuleReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryExitRuleReview[]): Map<string, string[]> {
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

export function defaultPrimaryExitRuleReviewValidator(): PrimaryExitRuleReviewValidator {
  return new PrimaryExitRuleReviewValidator(
    [
      new PrimaryExitRuleReviewNameLengthRule(16),
      new PrimaryExitRuleReviewRequiredNameRule("primary exit rule review needs this field"),
      new PrimaryExitRuleReviewOwnerIdLengthRule(16),
      new PrimaryExitRuleReviewCeilingRangeRule(6.3, 4720.2),
      new PrimaryExitRuleReviewRatioRangeRule(8.8, 369.8),
      new PrimaryExitRuleReviewAllowedCodeRule(["legacy", "strict"]),
    ],
  );
}
