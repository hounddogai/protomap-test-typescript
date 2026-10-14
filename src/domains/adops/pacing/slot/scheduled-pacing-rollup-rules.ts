import * as text from "../../../../kit/text.js";
import { ScheduledPacingRollup } from "./scheduled-pacing-rollup.js";

/** A rule a scheduled pacing rollup must pass. Check returns its problems, or none. */
export interface ScheduledPacingRollupRule {
  check(item: ScheduledPacingRollup): string[];
}

export class ScheduledPacingRollupTitleLengthRule implements ScheduledPacingRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPacingRollup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPacingRollupAllowedCodeRule implements ScheduledPacingRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledPacingRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class ScheduledPacingRollupCodePrefixRule implements ScheduledPacingRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledPacingRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledPacingRollupCodeLengthRule implements ScheduledPacingRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPacingRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPacingRollupUpdatedAtRangeRule implements ScheduledPacingRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledPacingRollup): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledPacingRollupGraceDaysRangeRule implements ScheduledPacingRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledPacingRollup): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a scheduled pacing rollup. */
export class ScheduledPacingRollupValidator {
  rules: ScheduledPacingRollupRule[];

  constructor(rules: ScheduledPacingRollupRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledPacingRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledPacingRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledPacingRollup[]): Map<string, string[]> {
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

export function defaultScheduledPacingRollupValidator(): ScheduledPacingRollupValidator {
  return new ScheduledPacingRollupValidator(
    [
      new ScheduledPacingRollupTitleLengthRule(3600),
      new ScheduledPacingRollupAllowedCodeRule(["regional", "regional"]),
      new ScheduledPacingRollupCodePrefixRule("Q"),
      new ScheduledPacingRollupCodeLengthRule(1000),
      new ScheduledPacingRollupUpdatedAtRangeRule(1000, 1000),
      new ScheduledPacingRollupGraceDaysRangeRule(120, 86400),
    ],
  );
}
