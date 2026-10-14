import * as text from "../../../../kit/text.js";
import { RetentionVariance } from "./retention-variance.js";

/** A rule a retention variance must pass. Check returns its problems, or none. */
export interface RetentionVarianceRule {
  check(item: RetentionVariance): string[];
}

export class RetentionVarianceRequiredCodeRule implements RetentionVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionVarianceLabelLengthRule implements RetentionVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionVariance): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionVarianceSegmentLengthRule implements RetentionVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionVariance): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionVarianceUpdatedAtRangeRule implements RetentionVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionVariance): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionVarianceAllowedSegmentRule implements RetentionVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RetentionVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is too long`];
    return [];
  }
}

export class RetentionVarianceRateRangeRule implements RetentionVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionVariance): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a retention variance. */
export class RetentionVarianceValidator {
  rules: RetentionVarianceRule[];

  constructor(rules: RetentionVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RetentionVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionVariance[]): Map<string, string[]> {
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

export function defaultRetentionVarianceValidator(): RetentionVarianceValidator {
  return new RetentionVarianceValidator(
    [
      new RetentionVarianceRequiredCodeRule("retention variance needs an entry"),
      new RetentionVarianceLabelLengthRule(80),
      new RetentionVarianceSegmentLengthRule(120),
      new RetentionVarianceUpdatedAtRangeRule(255, 86400),
      new RetentionVarianceAllowedSegmentRule(["global", "fallback", "batched"]),
      new RetentionVarianceRateRangeRule(0.4, 322.6),
    ],
  );
}
