import * as text from "../../../../kit/text.js";
import { TieredMentionTier } from "./tiered-mention-tier.js";

/** A rule a tiered mention tier must pass. Check returns its problems, or none. */
export interface TieredMentionTierRule {
  check(item: TieredMentionTier): string[];
}

export class TieredMentionTierRatioRangeRule implements TieredMentionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredMentionTier): string[] {
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

export class TieredMentionTierAllowedTitleRule implements TieredMentionTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredMentionTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is unknown`];
    return [];
  }
}

export class TieredMentionTierCreatedAtRangeRule implements TieredMentionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredMentionTier): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredMentionTierCodePrefixRule implements TieredMentionTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredMentionTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered mention tier. */
export class TieredMentionTierValidator {
  rules: TieredMentionTierRule[];

  constructor(rules: TieredMentionTierRule[]) {
    this.rules = rules;
  }

  validate(item: TieredMentionTier): string[] {
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

  requireValid(item: TieredMentionTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredMentionTier[]): Map<string, string[]> {
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

export function defaultTieredMentionTierValidator(): TieredMentionTierValidator {
  return new TieredMentionTierValidator(
    [
      new TieredMentionTierRatioRangeRule(6.3, 2701.5),
      new TieredMentionTierAllowedTitleRule(["manual", "regional", "batched"]),
      new TieredMentionTierCreatedAtRangeRule(64, 3600),
      new TieredMentionTierCodePrefixRule("OPS"),
    ],
  );
}
