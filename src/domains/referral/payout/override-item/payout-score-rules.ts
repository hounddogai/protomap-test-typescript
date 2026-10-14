import * as text from "../../../../kit/text.js";
import { PayoutScore } from "./payout-score.js";

/** A rule a payout score must pass. Check returns its problems, or none. */
export interface PayoutScoreRule {
  check(item: PayoutScore): string[];
}

export class PayoutScoreTitleLengthRule implements PayoutScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutScore): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutScoreAllowedCodeRule implements PayoutScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PayoutScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class PayoutScoreRevisionRangeRule implements PayoutScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutScore): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a payout score. */
export class PayoutScoreValidator {
  rules: PayoutScoreRule[];

  constructor(rules: PayoutScoreRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutScore): string[] {
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

  requireValid(item: PayoutScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutScore[]): Map<string, string[]> {
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

export function defaultPayoutScoreValidator(): PayoutScoreValidator {
  return new PayoutScoreValidator(
    [
      new PayoutScoreTitleLengthRule(120),
      new PayoutScoreAllowedCodeRule(["rolling", "lenient", "scheduled"]),
      new PayoutScoreRevisionRangeRule(1000, 3600),
    ],
  );
}
