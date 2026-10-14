import * as text from "../../../../kit/text.js";
import { ScheduledWindowTier } from "./scheduled-window-tier.js";

/** A rule a scheduled window tier must pass. Check returns its problems, or none. */
export interface ScheduledWindowTierRule {
  check(item: ScheduledWindowTier): string[];
}

export class ScheduledWindowTierAllowedCodeRule implements ScheduledWindowTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledWindowTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class ScheduledWindowTierCodePrefixRule implements ScheduledWindowTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledWindowTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledWindowTierTitleLengthRule implements ScheduledWindowTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledWindowTier): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledWindowTierImpressionsRangeRule implements ScheduledWindowTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledWindowTier): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledWindowTierRequiredTitleRule implements ScheduledWindowTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledWindowTier): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledWindowTierRequiredSummaryRule implements ScheduledWindowTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledWindowTier): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled window tier. */
export class ScheduledWindowTierValidator {
  rules: ScheduledWindowTierRule[];

  constructor(rules: ScheduledWindowTierRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledWindowTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledWindowTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledWindowTier[]): Map<string, string[]> {
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

export function defaultScheduledWindowTierValidator(): ScheduledWindowTierValidator {
  return new ScheduledWindowTierValidator(
    [
      new ScheduledWindowTierAllowedCodeRule(["scheduled", "seasonal"]),
      new ScheduledWindowTierCodePrefixRule("Q"),
      new ScheduledWindowTierTitleLengthRule(32),
      new ScheduledWindowTierImpressionsRangeRule(1000, 3600),
      new ScheduledWindowTierRequiredTitleRule("scheduled window tier needs this field"),
      new ScheduledWindowTierRequiredSummaryRule("scheduled window tier needs this field"),
    ],
  );
}
