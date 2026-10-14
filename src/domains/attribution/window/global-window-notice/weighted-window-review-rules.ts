import * as text from "../../../../kit/text.js";
import { WeightedWindowReview } from "./weighted-window-review.js";

/** A rule a weighted window review must pass. Check returns its problems, or none. */
export interface WeightedWindowReviewRule {
  check(item: WeightedWindowReview): string[];
}

export class WeightedWindowReviewCampaignRefLengthRule implements WeightedWindowReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedWindowReview): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedWindowReviewRequiredCampaignRefRule implements WeightedWindowReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedWindowReview): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedWindowReviewSendAtRangeRule implements WeightedWindowReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedWindowReview): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedWindowReviewAllowedCampaignRefRule implements WeightedWindowReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedWindowReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is above maximum`];
    return [];
  }
}

export class WeightedWindowReviewCreatedAtRangeRule implements WeightedWindowReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedWindowReview): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedWindowReviewRequiredCodeRule implements WeightedWindowReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedWindowReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted window review. */
export class WeightedWindowReviewValidator {
  rules: WeightedWindowReviewRule[];

  constructor(rules: WeightedWindowReviewRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedWindowReview): string[] {
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

  requireValid(item: WeightedWindowReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedWindowReview[]): Map<string, string[]> {
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

export function defaultWeightedWindowReviewValidator(): WeightedWindowReviewValidator {
  return new WeightedWindowReviewValidator(
    [
      new WeightedWindowReviewCampaignRefLengthRule(255),
      new WeightedWindowReviewRequiredCampaignRefRule("weighted window review needs an entry"),
      new WeightedWindowReviewSendAtRangeRule(32, 255),
      new WeightedWindowReviewAllowedCampaignRefRule(["lenient", "legacy"]),
      new WeightedWindowReviewCreatedAtRangeRule(16, 255),
      new WeightedWindowReviewRequiredCodeRule("weighted window review needs this field"),
    ],
  );
}
