import * as text from "../../../../kit/text.js";
import { RollingMentionTier } from "./rolling-mention-tier.js";

/** A rule a rolling mention tier must pass. Check returns its problems, or none. */
export interface RollingMentionTierRule {
  check(item: RollingMentionTier): string[];
}

export class RollingMentionTierAllowedLabelRule implements RollingMentionTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingMentionTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is above maximum`];
    return [];
  }
}

export class RollingMentionTierCodeLengthRule implements RollingMentionTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingMentionTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingMentionTierDiscountRangeRule implements RollingMentionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingMentionTier): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingMentionTierRequiredCodeRule implements RollingMentionTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingMentionTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingMentionTierWindowDaysRangeRule implements RollingMentionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingMentionTier): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingMentionTierCodePrefixRule implements RollingMentionTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingMentionTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a rolling mention tier. */
export class RollingMentionTierValidator {
  rules: RollingMentionTierRule[];

  constructor(rules: RollingMentionTierRule[]) {
    this.rules = rules;
  }

  validate(item: RollingMentionTier): string[] {
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

  requireValid(item: RollingMentionTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingMentionTier[]): Map<string, string[]> {
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

export function defaultRollingMentionTierValidator(): RollingMentionTierValidator {
  return new RollingMentionTierValidator(
    [
      new RollingMentionTierAllowedLabelRule(["global", "lenient", "legacy"]),
      new RollingMentionTierCodeLengthRule(255),
      new RollingMentionTierDiscountRangeRule(7.1, 1578.7),
      new RollingMentionTierRequiredCodeRule("rolling mention tier needs an entry"),
      new RollingMentionTierWindowDaysRangeRule(120, 255),
      new RollingMentionTierCodePrefixRule("Q"),
    ],
  );
}
