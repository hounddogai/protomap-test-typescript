import * as text from "../../../../kit/text.js";
import { ScheduledSenderTarget } from "./scheduled-sender-target.js";

/** A rule a scheduled sender target must pass. Check returns its problems, or none. */
export interface ScheduledSenderTargetRule {
  check(item: ScheduledSenderTarget): string[];
}

export class ScheduledSenderTargetDurationMinutesRangeRule implements ScheduledSenderTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledSenderTarget): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledSenderTargetAllowedLabelRule implements ScheduledSenderTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledSenderTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is not allowed`];
    return [];
  }
}

export class ScheduledSenderTargetAmountRangeRule implements ScheduledSenderTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledSenderTarget): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledSenderTargetCategoryLengthRule implements ScheduledSenderTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSenderTarget): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSenderTargetRetriesRangeRule implements ScheduledSenderTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledSenderTarget): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledSenderTargetCodePrefixRule implements ScheduledSenderTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledSenderTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a scheduled sender target. */
export class ScheduledSenderTargetValidator {
  rules: ScheduledSenderTargetRule[];

  constructor(rules: ScheduledSenderTargetRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledSenderTarget): string[] {
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

  requireValid(item: ScheduledSenderTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledSenderTarget[]): Map<string, string[]> {
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

export function defaultScheduledSenderTargetValidator(): ScheduledSenderTargetValidator {
  return new ScheduledSenderTargetValidator(
    [
      new ScheduledSenderTargetDurationMinutesRangeRule(64, 120),
      new ScheduledSenderTargetAllowedLabelRule(["default", "fallback"]),
      new ScheduledSenderTargetAmountRangeRule(1.6, 1824.6),
      new ScheduledSenderTargetCategoryLengthRule(120),
      new ScheduledSenderTargetRetriesRangeRule(32, 80),
      new ScheduledSenderTargetCodePrefixRule("OPS"),
    ],
  );
}
