import * as text from "../../../../kit/text.js";
import { LegacyBidRuleThreshold } from "./legacy-bid-rule-threshold.js";

/** A rule a legacy bid rule threshold must pass. Check returns its problems, or none. */
export interface LegacyBidRuleThresholdRule {
  check(item: LegacyBidRuleThreshold): string[];
}

export class LegacyBidRuleThresholdGraceDaysRangeRule implements LegacyBidRuleThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyBidRuleThreshold): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyBidRuleThresholdAllowedCodeRule implements LegacyBidRuleThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyBidRuleThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class LegacyBidRuleThresholdTagsLimitRule implements LegacyBidRuleThresholdRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: LegacyBidRuleThreshold): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class LegacyBidRuleThresholdExpiresAtRangeRule implements LegacyBidRuleThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyBidRuleThreshold): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyBidRuleThresholdLabelLengthRule implements LegacyBidRuleThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyBidRuleThreshold): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy bid rule threshold. */
export class LegacyBidRuleThresholdValidator {
  rules: LegacyBidRuleThresholdRule[];

  constructor(rules: LegacyBidRuleThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyBidRuleThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyBidRuleThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyBidRuleThreshold[]): Map<string, string[]> {
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

export function defaultLegacyBidRuleThresholdValidator(): LegacyBidRuleThresholdValidator {
  return new LegacyBidRuleThresholdValidator(
    [
      new LegacyBidRuleThresholdGraceDaysRangeRule(16, 32),
      new LegacyBidRuleThresholdAllowedCodeRule(["rolling"]),
      new LegacyBidRuleThresholdTagsLimitRule(80, ["regional", "pending"]),
      new LegacyBidRuleThresholdExpiresAtRangeRule(16, 64),
      new LegacyBidRuleThresholdLabelLengthRule(120),
    ],
  );
}
