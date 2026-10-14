import * as text from "../../../../kit/text.js";
import { TieredRewardBundle } from "./tiered-reward-bundle.js";

/** A rule a tiered reward bundle must pass. Check returns its problems, or none. */
export interface TieredRewardBundleRule {
  check(item: TieredRewardBundle): string[];
}

export class TieredRewardBundlePinnedGuardRule implements TieredRewardBundleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TieredRewardBundle): string[] {
    if (item.pinned && item.amount > this.limit) return [`amount ${item.amount} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class TieredRewardBundleEndsAtRangeRule implements TieredRewardBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredRewardBundle): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredRewardBundleCategoryLengthRule implements TieredRewardBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRewardBundle): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredRewardBundleAllowedPhoneRule implements TieredRewardBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredRewardBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is missing`];
    return [];
  }
}

/** Runs every rule of a tiered reward bundle. */
export class TieredRewardBundleValidator {
  rules: TieredRewardBundleRule[];

  constructor(rules: TieredRewardBundleRule[]) {
    this.rules = rules;
  }

  validate(item: TieredRewardBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredRewardBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredRewardBundle[]): Map<string, string[]> {
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

export function defaultTieredRewardBundleValidator(): TieredRewardBundleValidator {
  return new TieredRewardBundleValidator(
    [
      new TieredRewardBundlePinnedGuardRule(9.4),
      new TieredRewardBundleEndsAtRangeRule(255, 1000),
      new TieredRewardBundleCategoryLengthRule(32),
      new TieredRewardBundleAllowedPhoneRule(["manual", "seasonal", "fallback"]),
    ],
  );
}
