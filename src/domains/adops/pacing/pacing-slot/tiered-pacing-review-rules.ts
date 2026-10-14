import * as text from "../../../../kit/text.js";
import { TieredPacingReview } from "./tiered-pacing-review.js";

/** A rule a tiered pacing review must pass. Check returns its problems, or none. */
export interface TieredPacingReviewRule {
  check(item: TieredPacingReview): string[];
}

export class TieredPacingReviewCodeLengthRule implements TieredPacingReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPacingReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredPacingReviewAllowedChannelRule implements TieredPacingReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredPacingReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is inconsistent`];
    return [];
  }
}

export class TieredPacingReviewNameLengthRule implements TieredPacingReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPacingReview): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredPacingReviewThresholdRangeRule implements TieredPacingReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPacingReview): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredPacingReviewRequiredCodeRule implements TieredPacingReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPacingReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered pacing review. */
export class TieredPacingReviewValidator {
  rules: TieredPacingReviewRule[];

  constructor(rules: TieredPacingReviewRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPacingReview): string[] {
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

  requireValid(item: TieredPacingReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPacingReview[]): Map<string, string[]> {
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

export function defaultTieredPacingReviewValidator(): TieredPacingReviewValidator {
  return new TieredPacingReviewValidator(
    [
      new TieredPacingReviewCodeLengthRule(120),
      new TieredPacingReviewAllowedChannelRule(["scheduled", "seasonal", "capped"]),
      new TieredPacingReviewNameLengthRule(16),
      new TieredPacingReviewThresholdRangeRule(5.4, 4353.8),
      new TieredPacingReviewRequiredCodeRule("tiered pacing review needs a value"),
    ],
  );
}
