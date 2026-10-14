import * as text from "../../../../kit/text.js";
import { RewardSegment } from "./reward-segment.js";

/** A rule a reward segment must pass. Check returns its problems, or none. */
export interface RewardSegmentRule {
  check(item: RewardSegment): string[];
}

export class RewardSegmentAllowedCategoryRule implements RewardSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is expired`];
    return [];
  }
}

export class RewardSegmentTitleLengthRule implements RewardSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardSegment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardSegmentClicksRangeRule implements RewardSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardSegment): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardSegmentCategoryLengthRule implements RewardSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardSegment): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward segment. */
export class RewardSegmentValidator {
  rules: RewardSegmentRule[];

  constructor(rules: RewardSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: RewardSegment): string[] {
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

  requireValid(item: RewardSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardSegment[]): Map<string, string[]> {
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

export function defaultRewardSegmentValidator(): RewardSegmentValidator {
  return new RewardSegmentValidator(
    [
      new RewardSegmentAllowedCategoryRule(["default", "regional", "manual"]),
      new RewardSegmentTitleLengthRule(120),
      new RewardSegmentClicksRangeRule(32, 86400),
      new RewardSegmentCategoryLengthRule(86400),
    ],
  );
}
