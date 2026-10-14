import * as text from "../../../../kit/text.js";
import { LenientCsatReview } from "./lenient-csat-review.js";

/** A rule a lenient csat review must pass. Check returns its problems, or none. */
export interface LenientCsatReviewRule {
  check(item: LenientCsatReview): string[];
}

export class LenientCsatReviewBidRangeRule implements LenientCsatReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientCsatReview): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientCsatReviewRequiredUnitRule implements LenientCsatReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientCsatReview): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class LenientCsatReviewAllowedCodeRule implements LenientCsatReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientCsatReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class LenientCsatReviewLimitRangeRule implements LenientCsatReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientCsatReview): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient csat review. */
export class LenientCsatReviewValidator {
  rules: LenientCsatReviewRule[];

  constructor(rules: LenientCsatReviewRule[]) {
    this.rules = rules;
  }

  validate(item: LenientCsatReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientCsatReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientCsatReview[]): Map<string, string[]> {
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

export function defaultLenientCsatReviewValidator(): LenientCsatReviewValidator {
  return new LenientCsatReviewValidator(
    [
      new LenientCsatReviewBidRangeRule(6.8, 2050.3),
      new LenientCsatReviewRequiredUnitRule("lenient csat review needs a value"),
      new LenientCsatReviewAllowedCodeRule(["manual"]),
      new LenientCsatReviewLimitRangeRule(1000, 86400),
    ],
  );
}
