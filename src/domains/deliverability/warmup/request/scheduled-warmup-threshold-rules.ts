import * as text from "../../../../kit/text.js";
import { ScheduledWarmupThreshold } from "./scheduled-warmup-threshold.js";

/** A rule a scheduled warmup threshold must pass. Check returns its problems, or none. */
export interface ScheduledWarmupThresholdRule {
  check(item: ScheduledWarmupThreshold): string[];
}

export class ScheduledWarmupThresholdMarginRangeRule implements ScheduledWarmupThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledWarmupThreshold): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledWarmupThresholdCodePrefixRule implements ScheduledWarmupThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledWarmupThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledWarmupThresholdAllowedTitleRule implements ScheduledWarmupThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledWarmupThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is too long`];
    return [];
  }
}

export class ScheduledWarmupThresholdTitleLengthRule implements ScheduledWarmupThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledWarmupThreshold): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledWarmupThresholdRevisionRangeRule implements ScheduledWarmupThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledWarmupThreshold): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledWarmupThresholdVariantLengthRule implements ScheduledWarmupThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledWarmupThreshold): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled warmup threshold. */
export class ScheduledWarmupThresholdValidator {
  rules: ScheduledWarmupThresholdRule[];

  constructor(rules: ScheduledWarmupThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledWarmupThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledWarmupThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledWarmupThreshold[]): Map<string, string[]> {
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

export function defaultScheduledWarmupThresholdValidator(): ScheduledWarmupThresholdValidator {
  return new ScheduledWarmupThresholdValidator(
    [
      new ScheduledWarmupThresholdMarginRangeRule(0.6, 3660.6),
      new ScheduledWarmupThresholdCodePrefixRule("OPS"),
      new ScheduledWarmupThresholdAllowedTitleRule(["strict", "scheduled", "capped"]),
      new ScheduledWarmupThresholdTitleLengthRule(80),
      new ScheduledWarmupThresholdRevisionRangeRule(16, 80),
      new ScheduledWarmupThresholdVariantLengthRule(32),
    ],
  );
}
