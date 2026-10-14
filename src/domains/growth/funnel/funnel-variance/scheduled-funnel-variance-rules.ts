import * as text from "../../../../kit/text.js";
import { ScheduledFunnelVariance } from "./scheduled-funnel-variance.js";

/** A rule a scheduled funnel variance must pass. Check returns its problems, or none. */
export interface ScheduledFunnelVarianceRule {
  check(item: ScheduledFunnelVariance): string[];
}

export class ScheduledFunnelVarianceCodeLengthRule implements ScheduledFunnelVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFunnelVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledFunnelVarianceRetriesRangeRule implements ScheduledFunnelVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledFunnelVariance): string[] {
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

export class ScheduledFunnelVarianceCategoryLengthRule implements ScheduledFunnelVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFunnelVariance): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledFunnelVarianceAllowedNameRule implements ScheduledFunnelVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledFunnelVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

/** Runs every rule of a scheduled funnel variance. */
export class ScheduledFunnelVarianceValidator {
  rules: ScheduledFunnelVarianceRule[];

  constructor(rules: ScheduledFunnelVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledFunnelVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledFunnelVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledFunnelVariance[]): Map<string, string[]> {
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

export function defaultScheduledFunnelVarianceValidator(): ScheduledFunnelVarianceValidator {
  return new ScheduledFunnelVarianceValidator(
    [
      new ScheduledFunnelVarianceCodeLengthRule(1000),
      new ScheduledFunnelVarianceRetriesRangeRule(16, 255),
      new ScheduledFunnelVarianceCategoryLengthRule(32),
      new ScheduledFunnelVarianceAllowedNameRule(["primary", "default", "regional"]),
    ],
  );
}
